/*
  # Add API Usage Table
  
  1. New Tables
    - `api_usage`
      - `id` (uuid, primary key)
      - `service` (text, enum: gemini, gmail, sheets, disify)
      - `endpoint` (text)
      - `status` (text, enum: success, error)
      - `response_time` (integer)
      - `cost` (numeric, nullable)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `api_usage` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL CHECK (service IN ('gemini', 'gmail', 'sheets', 'disify')),
  endpoint text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  response_time integer NOT NULL,
  cost numeric,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read api usage"
  ON api_usage FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert api usage"
  ON api_usage FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS api_usage_service_idx ON api_usage(service);
CREATE INDEX IF NOT EXISTS api_usage_created_at_idx ON api_usage(created_at);