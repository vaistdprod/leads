/*
  # Fix Settings Table and Add User Association

  1. New Tables
    - Ensure settings table exists with proper user association
    - Add missing columns and constraints
  
  2. Security
    - Enable RLS
    - Add policies for user-specific access
  
  3. Changes
    - Add user_id column and constraint
    - Add missing indexes
*/

-- Ensure settings table exists with proper structure
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  
  -- Google Integration
  google_client_id text,
  google_client_secret text,
  google_redirect_uri text,
  google_access_token text,
  google_refresh_token text,
  google_token_expiry timestamptz,
  
  -- Sheet IDs
  blacklist_sheet_id text,
  contacts_sheet_id text,
  
  -- Execution Settings
  auto_execution_enabled boolean DEFAULT false,
  cron_schedule text,
  last_execution_at timestamptz,
  
  -- AI Settings
  gemini_api_key text,
  gemini_model text DEFAULT 'gemini-pro',
  gemini_temperature numeric DEFAULT 0.7,
  gemini_top_k integer DEFAULT 40,
  gemini_top_p numeric DEFAULT 0.95,
  use_google_search boolean DEFAULT false,
  
  -- Prompt Templates
  enrichment_prompt text,
  email_prompt text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_user_settings UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings"
  ON settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle settings updates
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Create function to initialize settings for new users
CREATE OR REPLACE FUNCTION initialize_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_settings();

-- Create indexes
CREATE INDEX IF NOT EXISTS settings_user_id_idx ON settings(user_id);
CREATE INDEX IF NOT EXISTS settings_updated_at_idx ON settings(updated_at);

-- Initialize settings for existing users
INSERT INTO settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;