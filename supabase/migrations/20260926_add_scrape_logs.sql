-- ==============================================================================
-- Add Scrape Logs Table for Automated Discovery Monitoring
-- ==============================================================================

CREATE TABLE IF NOT EXISTS scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'tenders.go.ke' | 'agpo.go.ke' | 'mygov'
  status TEXT NOT NULL, -- 'success' | 'failed' | 'warning'
  tenders_found INTEGER NOT NULL DEFAULT 0,
  tenders_imported INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  stack_trace TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_scrape_logs_source ON scrape_logs(source);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_status ON scrape_logs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_created_at ON scrape_logs(created_at DESC);

ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to scrape_logs"
  ON scrape_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
