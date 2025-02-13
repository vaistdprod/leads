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
    endpoint text NOT NULL,
    status integer NOT NULL,
    duration integer NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on email_history
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on lead_history
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on api_usage
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for email_history
CREATE POLICY "Users can view their own email history"
    ON email_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email history"
    ON email_history FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create policies for lead_history
CREATE POLICY "Users can view their own lead history"
    ON lead_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lead history"
    ON lead_history FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create policies for api_usage
CREATE POLICY "Users can view their own api usage"
    ON api_usage FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own api usage"
    ON api_usage FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS email_history_user_id_idx ON email_history(user_id);
CREATE INDEX IF NOT EXISTS email_history_created_at_idx ON email_history(created_at DESC);
CREATE INDEX IF NOT EXISTS lead_history_user_id_idx ON lead_history(user_id);
CREATE INDEX IF NOT EXISTS lead_history_created_at_idx ON lead_history(created_at DESC);
CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS api_usage_created_at_idx ON api_usage(created_at DESC);

-- Add triggers for updated_at
CREATE TRIGGER update_email_history_updated_at
    BEFORE UPDATE ON email_history
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_lead_history_updated_at
    BEFORE UPDATE ON lead_history
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create function to initialize user data
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Create initial settings record
    INSERT INTO settings (user_id)
    VALUES (NEW.id);

    -- Create initial dashboard stats record
    INSERT INTO dashboard_stats (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize user data on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE initialize_user_data();
