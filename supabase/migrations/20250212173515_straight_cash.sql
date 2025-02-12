-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create the `function_logs` table
CREATE TABLE IF NOT EXISTS function_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name text NOT NULL,
    input_params jsonb,
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on function_logs
ALTER TABLE function_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert from functions
CREATE POLICY "Functions can insert logs"
    ON function_logs FOR INSERT
    TO postgres
    WITH CHECK (true);

-- Function to generate secure tokens
CREATE OR REPLACE FUNCTION generate_secure_token(length integer DEFAULT 32)
RETURNS text AS $$
BEGIN
  RETURN encode(extensions.gen_random_bytes(length), 'hex');
END;
$$
 LANGUAGE plpgsql SECURITY DEFINER;

-- Create the `signup_tokens` table
CREATE TABLE IF NOT EXISTS signup_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text UNIQUE NOT NULL,
    email text NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    used boolean DEFAULT false,
    used_by uuid REFERENCES auth.users(id),
    used_at timestamptz,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on signup_tokens
ALTER TABLE signup_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for signup_tokens
CREATE POLICY "Users can view their own signup tokens"
    ON signup_tokens FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can create signup tokens"
    ON signup_tokens FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own signup tokens"
    ON signup_tokens FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

-- Create indexes for signup_tokens
CREATE INDEX IF NOT EXISTS signup_tokens_token_idx ON signup_tokens(token);
CREATE INDEX IF NOT EXISTS signup_tokens_email_idx ON signup_tokens(email);
CREATE INDEX IF NOT EXISTS signup_tokens_created_by_idx ON signup_tokens(created_by);

-- Function to send emails via Loops
CREATE OR REPLACE FUNCTION send_loops_email(
  email_to text,
  template_id text,
  transactional_data jsonb,
  api_key text
)
RETURNS boolean AS $$
DECLARE
  response_status int;
  response_content text;
  request_url text := 'https://app.loops.so/api/v1/transactional';
  request_headers http_header[];
  request_body jsonb;
BEGIN
  -- Sanitize the API key (remove quotes, newlines, whitespace)
  api_key := regexp_replace(trim(api_key), '[\n\r\t]', '', 'g');

  -- Construct headers as http_header records
  request_headers := ARRAY[
    ROW('Authorization', 'Bearer ' || api_key)::http_header,
    ROW('Content-Type', 'application/json')::http_header
  ];

  -- Log debug information
  INSERT INTO function_logs (function_name, input_params)
  VALUES ('send_loops_email_debug', jsonb_build_object(
    'email_to', email_to,
    'template_id', template_id,
    'transactional_data', transactional_data,
    'headers', request_headers
  ));

  -- Construct request body with corrected structure
  request_body := jsonb_build_object(
    'email', email_to,
    'transactionalId', template_id,
    'dataVariables', jsonb_build_object(  -- Renamed to dataVariables
      'ConfirmationURL', transactional_data->>'signupUrl'  -- Mapped to ConfirmationURL
    )
  );

  -- Log HTTP request details
  RAISE NOTICE 'Requesting: URL=%, Headers=%, Body=%', request_url, request_headers, request_body::text;

  -- Perform HTTP request
  SELECT 
    status,
    content::text
  INTO 
    response_status,
    response_content
  FROM extensions.http(
    ROW(
        'POST',
        request_url,
        request_headers,
        'application/json',
        request_body::text
    )::http_request
  );

  -- Log response
  INSERT INTO function_logs (function_name, input_params)
  VALUES ('send_loops_email_response', jsonb_build_object(
    'status', response_status,
    'content', response_content
  ));

  -- Return success/failure
  RETURN response_status = 200 AND (response_content::jsonb->>'success')::boolean;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    INSERT INTO function_logs (function_name, input_params, error_message)
    VALUES ('send_loops_email_error', jsonb_build_object(
      'email_to', email_to,
      'template_id', template_id,
      'transactional_data', transactional_data,
      'headers', request_headers
    ), SQLERRM);
    RETURN false;
END;
$$
 LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create invites
CREATE OR REPLACE FUNCTION create_invite(
  email_to text,
  frontend_url text,
  loops_api_key text,
  template_id text,
  created_by uuid DEFAULT auth.uid()
)
RETURNS uuid AS $$
DECLARE
  token text;
  invite_id uuid;
  signup_url text;
BEGIN
  -- Generate token
  token := generate_secure_token();

  -- Create invite record
  INSERT INTO signup_tokens (
    token,
    email,
    created_by,
    expires_at
  ) VALUES (
    token,
    email_to,
    created_by,
    now() + interval '7 days'
  ) RETURNING id INTO invite_id;

  -- Generate signup URL (fix double slash issue)
  signup_url := rtrim(frontend_url, '/') || '/auth/register?signup_token=' || token || '&email=' || email_to;

  -- Send email via Loops
  PERFORM send_loops_email(
    email_to,
    template_id,
    jsonb_build_object(
      'signupUrl', signup_url,
      'expiresAt', (now() + interval '7 days')::text
    ),
    loops_api_key
  );

  -- Return invite ID
  RETURN invite_id;
END;
$$
 LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_invite(text, text, text, text, uuid) TO authenticated;