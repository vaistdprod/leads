/*
  # Fix Settings Structure

  1. Changes
    - Add dashboard_stats view for overview statistics
    - Add missing foreign key constraints
    - Add missing indexes for performance
    - Update RLS policies for better security

  2. New Views
    - dashboard_stats: Aggregates statistics for the dashboard overview
*/

-- Create dashboard_stats view for overview statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  user_id,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.email_status = 'valid' THEN l.id END) as processed_leads,
  ROUND(
    (COUNT(DISTINCT CASE WHEN l.email_sent = true THEN l.id END)::float / 
    NULLIF(COUNT(DISTINCT l.id), 0) * 100)::numeric, 1
  ) as success_rate,
  MAX(l.updated_at) as last_processed,
  COUNT(DISTINCT CASE WHEN l.email_status = 'blacklisted' THEN l.id END) as blacklist_count,
  COUNT(DISTINCT CASE WHEN l.email_sent = true THEN l.id END) as emails_sent,
  COUNT(DISTINCT CASE WHEN l.email_status = 'pending' THEN l.id END) as emails_queued
FROM leads l
GROUP BY user_id;

-- Add RLS policy for dashboard_stats
CREATE POLICY "Users can view their own dashboard stats"
  ON dashboard_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure settings table has user_id column and constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE settings ADD COLUMN user_id uuid REFERENCES auth.users(id);
    ALTER TABLE settings ADD CONSTRAINT settings_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Create function to initialize user settings
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

-- Add missing indexes
CREATE INDEX IF NOT EXISTS settings_updated_at_idx ON settings(updated_at);
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads(user_id);
CREATE INDEX IF NOT EXISTS leads_email_status_idx ON leads(email_status);
CREATE INDEX IF NOT EXISTS leads_email_sent_idx ON leads(email_sent);