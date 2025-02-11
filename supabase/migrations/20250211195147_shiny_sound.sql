/*
  # Add Lead History Table

  1. New Tables
    - `lead_history` table for tracking lead activities
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - Lead activity details
      - Timestamps

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS lead_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  lead_id uuid REFERENCES leads(id),
  action text NOT NULL CHECK (action IN ('created', 'enriched', 'verified', 'contacted', 'blacklisted')),
  details text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own lead history"
  ON lead_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lead history"
  ON lead_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX lead_history_user_id_idx ON lead_history(user_id);
CREATE INDEX lead_history_created_at_idx ON lead_history(created_at);
CREATE INDEX lead_history_action_idx ON lead_history(action);