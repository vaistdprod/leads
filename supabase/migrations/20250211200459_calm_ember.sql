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
CREATE POLICY "Anyone can read invites"
  ON invites FOR SELECT
  TO authenticated
  USING (true);

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
  TO authenticated
  USING (NOT used)
  WITH CHECK (NOT used);

-- Create indexes
CREATE INDEX invites_code_idx ON invites(code);
CREATE INDEX invites_used_idx ON invites(used);