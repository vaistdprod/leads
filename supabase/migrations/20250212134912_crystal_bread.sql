/*
  # Enable HTTP extension
  
  1. Changes
    - Enable the http extension required for making HTTP requests
    - Create composite type http_response for handling HTTP responses
*/

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create http_response type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE http_response AS (
        status integer,
        content text,
        json_content jsonb
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;