/*
  # Rate Limiting and OAuth Integration

  1. New Tables
    - `invite_attempts` - Track failed invite code attempts
    - Add `allowed_email` column to `invites` table

  2. Security
    - Rate limiting for failed invite attempts
    - Email matching requirement for invites
*/

-- Add rate limiting table for invite attempts
CREATE TABLE IF NOT EXISTS invite_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  attempt_count integer DEFAULT 1,
  last_attempt timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add email field to invites table
ALTER TABLE invites 
ADD COLUMN allowed_email text NOT NULL;

-- Enable RLS
ALTER TABLE invite_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert invite attempts"
  ON invite_attempts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own invite attempts"
  ON invite_attempts FOR UPDATE
  TO anon
  USING (ip_address = current_setting('request.headers')::json->>'x-real-ip');

-- Create indexes
CREATE INDEX invite_attempts_ip_address_idx ON invite_attempts(ip_address);
CREATE INDEX invite_attempts_last_attempt_idx ON invite_attempts(last_attempt);
CREATE INDEX invites_allowed_email_idx ON invites(allowed_email);

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION check_invite_rate_limit(client_ip text)
RETURNS boolean AS $$
DECLARE
  attempt_count integer;
  last_attempt timestamptz;
BEGIN
  -- Get current attempt count and last attempt time
  SELECT 
    ia.attempt_count,
    ia.last_attempt
  INTO 
    attempt_count,
    last_attempt
  FROM invite_attempts ia
  WHERE ia.ip_address = client_ip;

  -- If no attempts found, allow
  IF attempt_count IS NULL THEN
    RETURN true;
  END IF;

  -- If more than 5 attempts in 15 minutes, block
  IF attempt_count >= 5 AND last_attempt > now() - interval '15 minutes' THEN
    RETURN false;
  END IF;

  -- If last attempt was more than 15 minutes ago, reset counter
  IF last_attempt <= now() - interval '15 minutes' THEN
    UPDATE invite_attempts 
    SET attempt_count = 1, last_attempt = now()
    WHERE ip_address = client_ip;
    RETURN true;
  END IF;

  -- Increment attempt counter
  UPDATE invite_attempts 
  SET attempt_count = attempt_count + 1, last_attempt = now()
  WHERE ip_address = client_ip;

  RETURN true;
END;
$$ LANGUAGE plpgsql;