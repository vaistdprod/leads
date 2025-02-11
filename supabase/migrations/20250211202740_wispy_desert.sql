/*
  # Add invites table and functionality

  1. New Tables
    - `invites`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `created_by` (uuid, references auth.users)
      - `used` (boolean)
      - `used_by` (uuid, references auth.users)
      - `used_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `invites` table
    - Add policies for reading and updating invites
*/

CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  used boolean DEFAULT false,
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read unused invites"
  ON invites FOR SELECT
  TO anon
  USING (NOT used);

CREATE POLICY "Users can read their own invites"
  ON invites FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR used_by = auth.uid());

CREATE POLICY "Only admins can create invites"
  ON invites FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  ));

CREATE POLICY "Only unused invites can be updated"
  ON invites FOR UPDATE
  TO anon
  USING (NOT used)
  WITH CHECK (NOT used);

-- Create indexes
CREATE INDEX invites_code_idx ON invites(code);
CREATE INDEX invites_used_idx ON invites(used);