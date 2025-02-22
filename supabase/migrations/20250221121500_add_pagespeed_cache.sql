-- Create pagespeed_cache table
CREATE TABLE IF NOT EXISTS pagespeed_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    url text NOT NULL,
    mobile_results jsonb,
    desktop_results jsonb,
    analyzed_at timestamptz DEFAULT now(),
    UNIQUE(url)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS pagespeed_cache_url_idx ON pagespeed_cache(url);

-- Enable RLS
ALTER TABLE pagespeed_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read pagespeed cache"
    ON pagespeed_cache FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role can insert pagespeed cache"
    ON pagespeed_cache FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role can update pagespeed cache"
    ON pagespeed_cache FOR UPDATE
    TO service_role
    USING (true);
