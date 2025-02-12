/*
  # Add signup tokens table

  1. New Tables
    - `signup_tokens`
      - `id` (uuid, primary key)
      - `token` (text, unique)
      - `email` (text)
      - `created_by` (uuid, references auth.users)
      - `used` (boolean)
      - `used_by` (uuid, references auth.users)
      - `used_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for token management
*/

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
CREATE POLICY "Anyone can verify their own token"
  ON signup_tokens FOR SELECT
  TO anon
  USING (
    NOT used 
    AND expires_at > now()
  );

CREATE POLICY "Authenticated users can view all tokens"
  ON signup_tokens FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tokens"
  ON signup_tokens FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Token can be marked as used during registration"
  ON signup_tokens FOR UPDATE
  TO anon
  USING (
    NOT used 
    AND expires_at > now()
  )
  WITH CHECK (used = true);

-- Create function to generate random token
CREATE OR REPLACE FUNCTION generate_signup_token()
RETURNS text AS $$
DECLARE
  chars text[] := ARRAY['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
                       'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
                       '0','1','2','3','4','5','6','7','8','9'];
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || chars[1 + floor(random() * array_length(chars, 1))];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Create function to create a signup token
CREATE OR REPLACE FUNCTION create_signup_token(user_email text, expiry_hours integer DEFAULT 24)
RETURNS json AS $$
DECLARE
  new_token text;
  token_record signup_tokens;
BEGIN
  -- Generate unique token
  LOOP
    new_token := generate_signup_token();
    BEGIN
      INSERT INTO signup_tokens (token, email, created_by, expires_at)
      VALUES (
        new_token,
        user_email,
        auth.uid(),
        now() + (expiry_hours || ' hours')::interval
      )
      RETURNING * INTO token_record;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- Token collision, try again
      CONTINUE;
    END;
  END LOOP;

  RETURN json_build_object(
    'token', token_record.token,
    'email', token_record.email,
    'expires_at', token_record.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX signup_tokens_token_idx ON signup_tokens(token);
CREATE INDEX signup_tokens_email_idx ON signup_tokens(email);
CREATE INDEX signup_tokens_used_idx ON signup_tokens(used);
CREATE INDEX signup_tokens_expires_at_idx ON signup_tokens(expires_at);