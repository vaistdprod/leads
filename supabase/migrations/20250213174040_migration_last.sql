-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the settings table
CREATE TABLE IF NOT EXISTS settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    blacklist_sheet_id text,
    contacts_sheet_id text,
    auto_execution_enabled boolean DEFAULT false,
    cron_schedule text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create the dashboard_stats table
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    total_leads integer DEFAULT 0,
    processed_leads integer DEFAULT 0,
    success_rate numeric DEFAULT 0,
    last_processed timestamptz,
    blacklist_count integer DEFAULT 0,
    contacts_count integer DEFAULT 0,
    emails_sent integer DEFAULT 0,
    emails_queued integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create email_history table
CREATE TABLE IF NOT EXISTS email_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    email text NOT NULL,
    subject text,
    status text NOT NULL,
    error text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create lead_history table
CREATE TABLE IF NOT EXISTS lead_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    email text NOT NULL,
    status text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create api_usage table
CREATE TABLE IF NOT EXISTS api_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    service text NOT NULL,
    endpoint text NOT NULL,
    status integer NOT NULL,
    duration integer NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create processing_logs table
CREATE TABLE IF NOT EXISTS processing_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    status text NOT NULL,
    details jsonb,
    duration integer,
    leads_processed integer DEFAULT 0,
    leads_success integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Create index for processing_logs
CREATE INDEX IF NOT EXISTS processing_logs_user_id_idx ON processing_logs(user_id);
CREATE INDEX IF NOT EXISTS processing_logs_created_at_idx ON processing_logs(created_at ASC);

-- Enable RLS on processing_logs
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for processing_logs
CREATE POLICY "Users can view their own processing logs"
    ON processing_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processing logs"
    ON processing_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can do anything with processing logs"
    ON processing_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create function_logs table
CREATE TABLE IF NOT EXISTS function_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name text NOT NULL,
    input_params jsonb,
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS settings_user_id_idx ON settings(user_id);
CREATE INDEX IF NOT EXISTS dashboard_stats_user_id_idx ON dashboard_stats(user_id);
CREATE INDEX IF NOT EXISTS email_history_user_id_idx ON email_history(user_id);
CREATE INDEX IF NOT EXISTS email_history_created_at_idx ON email_history(created_at DESC);
CREATE INDEX IF NOT EXISTS lead_history_user_id_idx ON lead_history(user_id);
CREATE INDEX IF NOT EXISTS lead_history_created_at_idx ON lead_history(created_at DESC);
CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS api_usage_created_at_idx ON api_usage(created_at DESC);

-- Add triggers for updated_at
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_dashboard_stats_updated_at
    BEFORE UPDATE ON dashboard_stats
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_email_history_updated_at
    BEFORE UPDATE ON email_history
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_lead_history_updated_at
    BEFORE UPDATE ON lead_history
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create RLS policies
-- Settings
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

CREATE POLICY "Service role can do anything with settings"
    ON settings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Dashboard Stats
CREATE POLICY "Users can view their own dashboard stats"
    ON dashboard_stats FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard stats"
    ON dashboard_stats FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard stats"
    ON dashboard_stats FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can do anything with dashboard stats"
    ON dashboard_stats FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Email History
CREATE POLICY "Users can view their own email history"
    ON email_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email history"
    ON email_history FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Lead History
CREATE POLICY "Users can view their own lead history"
    ON lead_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lead history"
    ON lead_history FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- API Usage
CREATE POLICY "Users can view their own api usage"
    ON api_usage FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own api usage"
    ON api_usage FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Function Logs
CREATE POLICY "Functions can insert logs"
    ON function_logs FOR INSERT
    TO postgres
    WITH CHECK (true);

-- Create function to initialize user data
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create initial settings record
    INSERT INTO public.settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Create initial dashboard stats record
    INSERT INTO public.dashboard_stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Create trigger to initialize user data on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_data();
