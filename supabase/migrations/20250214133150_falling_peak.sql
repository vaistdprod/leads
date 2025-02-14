/*
  # Add AI settings columns
  
  1. Changes
    - Add AI-related columns to settings table:
      - gemini_api_key (text)
      - model (text)
      - temperature (numeric)
      - top_k (integer)
      - top_p (numeric)
      - use_google_search (boolean)
      - enrichment_prompt (text)
      - email_prompt (text)
*/

-- Add AI settings columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS gemini_api_key text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS model text DEFAULT 'gemini-pro';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS temperature numeric DEFAULT 0.7;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS top_k integer DEFAULT 40;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS top_p numeric DEFAULT 0.95;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS use_google_search boolean DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS enrichment_prompt text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS email_prompt text;

-- Add comment explaining the columns
COMMENT ON TABLE settings IS 'User settings including Google Sheets integration and AI configuration';