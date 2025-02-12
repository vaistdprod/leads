-- Add logging table
CREATE TABLE IF NOT EXISTS function_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name text NOT NULL,
    input_params jsonb,
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE function_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert from functions
CREATE POLICY "Functions can insert logs"
    ON function_logs FOR INSERT
    TO postgres
    WITH CHECK (true);

-- Update send_loops_email function with logging
CREATE OR REPLACE FUNCTION send_loops_email(
  email_to text,
  template_id text,
  transactional_data jsonb,
  api_key text
)
RETURNS boolean AS $$
DECLARE
  response jsonb;
  http_response http_response;
BEGIN
  -- Log the attempt
  INSERT INTO function_logs (function_name, input_params)
  VALUES ('send_loops_email', jsonb_build_object(
    'email_to', email_to,
    'template_id', template_id,
    'transactional_data', transactional_data
  ));

  SELECT * INTO http_response
  FROM http((
    'POST',
    'https://api.loops.so/v1/transactional',
    ARRAY[('Authorization', 'Bearer ' || api_key)],
    'application/json',
    jsonb_build_object(
      'email', email_to,
      'templateId', template_id,
      'transactionalData', transactional_data
    )::text
  )::http_request);
  
  -- Log the response
  INSERT INTO function_logs (function_name, input_params)
  VALUES ('send_loops_email_response', jsonb_build_object(
    'status', http_response.status,
    'content', http_response.content
  ));
  
  response := http_response.content::jsonb;
  RETURN response->>'status' = 'success';
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO function_logs (function_name, input_params, error_message)
    VALUES ('send_loops_email', jsonb_build_object(
      'email_to', email_to,
      'template_id', template_id,
      'transactional_data', transactional_data
    ), SQLERRM);
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;