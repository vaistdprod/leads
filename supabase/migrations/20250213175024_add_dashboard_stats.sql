-- Create the dashboard_stats table
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
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

-- Enable RLS on dashboard_stats
ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboard_stats
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS dashboard_stats_user_id_idx ON dashboard_stats(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_dashboard_stats_updated_at
    BEFORE UPDATE ON dashboard_stats
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
