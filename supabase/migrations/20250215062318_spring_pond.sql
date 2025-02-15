-- Add impersonated_email column to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS impersonated_email text;

-- Add comment explaining the column
COMMENT ON COLUMN settings.impersonated_email IS 'Email address to impersonate when sending emails';20250215062318_spring_pond.sql