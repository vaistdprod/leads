/*
  # Initial Schema Setup

  1. Tables
    - users (auth.users built-in)
    - user_profiles
    - settings
    - leads
    - email_history
    - lead_history
    - signup_tokens

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    setup_completed BOOLEAN DEFAULT FALSE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    
    -- Google Integration
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

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    email text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    company text,
    position text,
    phone text,
    enrichment_data text,
    email_status text CHECK (email_status IN ('pending', 'valid', 'invalid')),
    email_sent boolean DEFAULT false,
    email_sent_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create email_history table
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

-- Create lead_history table
CREATE TABLE IF NOT EXISTS lead_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    lead_id uuid REFERENCES leads(id),
    action text NOT NULL CHECK (action IN ('created', 'enriched', 'verified', 'contacted', 'blacklisted')),
    details text NOT NULL,
    created_at timestamptz DEFAULT now()
);

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
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

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

CREATE POLICY "Users can view their own leads"
    ON leads FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
    ON leads FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
    ON leads FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own email history"
    ON email_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email history"
    ON email_history FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own lead history"
    ON lead_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lead history"
    ON lead_history FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX user_profiles_id_idx ON user_profiles(id);
CREATE INDEX settings_user_id_idx ON settings(user_id);
CREATE INDEX leads_user_id_idx ON leads(user_id);
CREATE INDEX leads_email_idx ON leads(email);
CREATE INDEX leads_email_status_idx ON leads(email_status);
CREATE INDEX email_history_user_id_idx ON email_history(user_id);
CREATE INDEX email_history_lead_id_idx ON email_history(lead_id);
CREATE INDEX lead_history_user_id_idx ON lead_history(user_id);
CREATE INDEX lead_history_lead_id_idx ON lead_history(lead_id);
CREATE INDEX signup_tokens_token_idx ON signup_tokens(token);
CREATE INDEX signup_tokens_email_idx ON signup_tokens(email);