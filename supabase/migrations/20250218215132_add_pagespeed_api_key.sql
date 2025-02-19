ALTER TABLE settings
ADD COLUMN pagespeed_api_key TEXT;

COMMENT ON COLUMN settings.pagespeed_api_key IS 'Google PageSpeed Insights API key for performance analysis';
