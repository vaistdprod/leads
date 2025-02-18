ALTER TABLE settings
ADD COLUMN IF NOT EXISTS seo_settings jsonb DEFAULT jsonb_build_object(
  'analysis', jsonb_build_object(
    'autoAnalyze', true,
    'crawlDepth', 2,
    'includeImages', true,
    'checkBrokenLinks', true,
    'analysisInterval', 'daily',
    'maxPagesPerScan', 100
  ),
  'content', jsonb_build_object(
    'temperature', 0.7,
    'maxTokens', 2000,
    'language', 'en',
    'tone', 'professional',
    'includeSources', true
  ),
  'notifications', jsonb_build_object(
    'emailAlerts', true,
    'weeklyReport', true,
    'performanceAlerts', true,
    'alertThreshold', 20
  )
);
