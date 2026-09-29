-- ------------------------------------------------------------------------------
-- Notifications Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'deadline_approaching', 'compliance_expiring', 'qualification_pending', 'checklist_incomplete', 'tender_discovered'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical', 'success'
  entity_type TEXT, -- 'tender', 'application', 'compliance_doc'
  entity_id UUID,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Allow authenticated users full access to notifications'
  ) THEN
    CREATE POLICY "Allow authenticated users full access to notifications"
      ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- System Settings Table (Single-row configuration)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_email TEXT DEFAULT 'tenders@hisako.co.ke',
  deadline_thresholds_days JSONB NOT NULL DEFAULT '[7, 3, 1]'::jsonb,
  compliance_thresholds_days JSONB NOT NULL DEFAULT '[60, 30, 14, 7]'::jsonb,
  auto_qualify_discovered BOOLEAN NOT NULL DEFAULT true,
  min_score_to_notify INTEGER NOT NULL DEFAULT 50,
  resend_api_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Allow authenticated users full access to system_settings'
  ) THEN
    CREATE POLICY "Allow authenticated users full access to system_settings"
      ON system_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO system_settings (
  id,
  email_notifications_enabled,
  in_app_notifications_enabled,
  notification_email,
  deadline_thresholds_days,
  compliance_thresholds_days,
  auto_qualify_discovered,
  min_score_to_notify
) VALUES (
  1,
  true,
  true,
  'tenders@hisako.co.ke',
  '[7, 3, 1]'::jsonb,
  '[60, 30, 14, 7]'::jsonb,
  true,
  50
) ON CONFLICT (id) DO NOTHING;
