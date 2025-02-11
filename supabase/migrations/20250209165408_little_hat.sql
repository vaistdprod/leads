/*
  # Lead Processing System Schema

  1. New Tables
    - `leads`
      - Stores all lead information and processing status
    - `processing_logs`
      - Tracks automation execution logs
    - `settings`
      - Stores system configuration
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create processing_logs table
CREATE TABLE IF NOT EXISTS processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage text NOT NULL CHECK (stage IN ('blacklist', 'enrichment', 'verification', 'email')),
  status text NOT NULL CHECK (status IN ('success', 'error')),
  message text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blacklist_sheet_id text NOT NULL,
  contacts_sheet_id text NOT NULL,
  auto_execution_enabled boolean DEFAULT false,
  cron_schedule text,
  last_execution_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read logs"
  ON processing_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert logs"
  ON processing_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
CREATE INDEX IF NOT EXISTS leads_email_status_idx ON leads(email_status);
CREATE INDEX IF NOT EXISTS logs_stage_idx ON processing_logs(stage);
CREATE INDEX IF NOT EXISTS logs_created_at_idx ON processing_logs(created_at);
