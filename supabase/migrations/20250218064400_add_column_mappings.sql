ALTER TABLE settings
ADD COLUMN column_mappings jsonb DEFAULT jsonb_build_object(
  'name', 'název',
  'email', 'email',
  'company', 'společnost',
  'position', 'pozice',
  'scheduledFor', 'scheduledfor',
  'status', 'status'
);

-- Add comment to explain the column
COMMENT ON COLUMN settings.column_mappings IS 'Maps internal field names to actual spreadsheet column names';
