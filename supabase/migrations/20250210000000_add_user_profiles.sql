CREATE TABLE user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    setup_completed BOOLEAN DEFAULT FALSE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow users to read their own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);
