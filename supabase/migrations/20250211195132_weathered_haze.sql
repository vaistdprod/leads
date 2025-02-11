/*
  # Add Settings Table

  1. New Tables
    - `settings` table for storing application settings
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - Various settings fields for Google, AI, and execution configuration
      - Timestamps

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  
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
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Create indexes
CREATE INDEX settings_user_id_idx ON settings(user_id);