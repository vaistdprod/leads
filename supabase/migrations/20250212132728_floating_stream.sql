/*
  # Setup signup system

  1. New Functions
    - generate_secure_token: Generates random tokens
    - send_loops_email: Sends emails via Loops API
    - create_invite: Creates invites and sends emails

  2. New Tables
    - signup_tokens: Stores invite tokens and their status

  3. Security
    - RLS policies for signup_tokens table
    - Function execution permissions
*/

-- Function to generate a secure random token
CREATE OR REPLACE FUNCTION generate_secure_token(length integer DEFAULT 32)
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(length), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send email via Loops
CREATE OR REPLACE FUNCTION send_loops_email(
  email_to text,
  template_id text,
  transactional_data jsonb,
  api_key text
)
RETURNS boolean AS $$
DECLARE
  response jsonb;
BEGIN
  SELECT content::jsonb INTO response
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
  
  RETURN response->>'status' = 'success';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main function to create invite and send email
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
  
  -- Generate signup URL
  signup_url := frontend_url || '/auth/register?signup_token=' || token || '&email=' || email_to;
  
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
  
  RETURN invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create signup_tokens table
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

-- Enable RLS
ALTER TABLE signup_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create indexes
CREATE INDEX signup_tokens_token_idx ON signup_tokens(token);
CREATE INDEX signup_tokens_email_idx ON signup_tokens(email);
CREATE INDEX signup_tokens_created_by_idx ON signup_tokens(created_by);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_invite(text, text, text, text, uuid) TO authenticated;