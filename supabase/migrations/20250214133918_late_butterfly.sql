/*
  # Fix settings table columns
  
  1. Changes
    - Drop and recreate AI-related columns to ensure proper configuration
    - Add default values for text columns
*/

-- Drop existing columns if they exist
DO $$ 
BEGIN
  ALTER TABLE settings DROP COLUMN IF EXISTS gemini_api_key;
  ALTER TABLE settings DROP COLUMN IF EXISTS model;
  ALTER TABLE settings DROP COLUMN IF EXISTS temperature;
  ALTER TABLE settings DROP COLUMN IF EXISTS top_k;
  ALTER TABLE settings DROP COLUMN IF EXISTS top_p;
  ALTER TABLE settings DROP COLUMN IF EXISTS use_google_search;
  ALTER TABLE settings DROP COLUMN IF EXISTS enrichment_prompt;
  ALTER TABLE settings DROP COLUMN IF EXISTS email_prompt;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
END $$;

-- Add columns with proper defaults
ALTER TABLE settings ADD COLUMN gemini_api_key text DEFAULT '';
ALTER TABLE settings ADD COLUMN model text DEFAULT 'gemini-pro';
ALTER TABLE settings ADD COLUMN temperature numeric DEFAULT 0.7;
ALTER TABLE settings ADD COLUMN top_k integer DEFAULT 40;
ALTER TABLE settings ADD COLUMN top_p numeric DEFAULT 0.95;
ALTER TABLE settings ADD COLUMN use_google_search boolean DEFAULT false;
ALTER TABLE settings ADD COLUMN enrichment_prompt text DEFAULT '';
ALTER TABLE settings ADD COLUMN email_prompt text DEFAULT '';

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';