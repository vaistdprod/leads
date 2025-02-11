/*
  # Add Email History Table

  1. New Tables
    - `email_history` table for tracking sent emails
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - Email details and status
      - Timestamps

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS email_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  lead_id uuid REFERENCES leads(id),
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  error text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own email history"
  ON email_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email history"
  ON email_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX email_history_user_id_idx ON email_history(user_id);
CREATE INDEX email_history_created_at_idx ON email_history(created_at);
CREATE INDEX email_history_status_idx ON email_history(status);