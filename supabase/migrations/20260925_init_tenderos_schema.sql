-- ==============================================================================
-- TenderOS Supabase Database Schema Migration
-- ==============================================================================

-- 1. Custom Enum Types
CREATE TYPE compliance_doc_type AS ENUM (
  'tax_compliance',
  'agpo_cert',
  'cr12',
  'business_permit',
  'kra_pin_cert',
  'bank_reference',
  'audited_accounts',
  'other'
);

CREATE TYPE compliance_doc_status AS ENUM (
  'valid',
  'expiring_soon',
  'expired'
);

CREATE TYPE tender_source AS ENUM (
  'mygov',
  'ifmis',
  'agpo_portal',
  'manual'
);

CREATE TYPE tender_status AS ENUM (
  'discovered',
  'qualifying',
  'qualified',
  'disqualified',
  'in_progress',
  'submitted',
  'won',
  'lost',
  'expired'
);

CREATE TYPE qualification_recommendation AS ENUM (
  'pursue',
  'skip',
  'borderline'
);

CREATE TYPE application_status AS ENUM (
  'drafting',
  'docs_ready',
  'submitted',
  'awarded',
  'rejected'
);

CREATE TYPE submission_method AS ENUM (
  'physical',
  'online_portal',
  'email'
);

CREATE TYPE generated_doc_type AS ENUM (
  'technical_proposal',
  'financial_proposal',
  'cover_letter',
  'compliance_bundle',
  'form_of_tender',
  'other'
);

CREATE TYPE generated_doc_status AS ENUM (
  'draft',
  'reviewed',
  'final'
);

CREATE TYPE agent_message_role AS ENUM (
  'user',
  'assistant',
  'tool'
);

CREATE TYPE tender_deadline_type AS ENUM (
  'submission',
  'clarification',
  'site_visit',
  'bid_bond'
);

-- ------------------------------------------------------------------------------
-- 1. Company Profile (Single-row configuration)
-- ------------------------------------------------------------------------------
CREATE TABLE company_profile (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  legal_name TEXT NOT NULL,
  registration_number TEXT,
  agpo_category TEXT DEFAULT 'Youth',
  agpo_cert_number TEXT,
  agpo_cert_expiry DATE,
  kra_pin TEXT,
  tax_compliance_cert_number TEXT,
  tax_compliance_cert_expiry DATE,
  cr12_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  business_permit_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  core_services JSONB NOT NULL DEFAULT '["ICT", "web", "app dev", "consultation"]'::jsonb,
  past_projects JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{client, value, year, description}]
  key_personnel JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{name, role, bio, cv_url}]
  bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {bank_name, branch, account_number, swift_code}
  physical_address TEXT,
  postal_address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. Compliance Documents
-- ------------------------------------------------------------------------------
CREATE TABLE compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type compliance_doc_type NOT NULL,
  file_url TEXT,
  issue_date DATE,
  expiry_date DATE,
  status compliance_doc_status NOT NULL DEFAULT 'valid',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. Tenders
-- ------------------------------------------------------------------------------
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source tender_source NOT NULL DEFAULT 'manual',
  external_reference TEXT,
  title TEXT NOT NULL,
  procuring_entity TEXT NOT NULL,
  category TEXT,
  description TEXT,
  publish_date TIMESTAMPTZ,
  submission_deadline TIMESTAMPTZ NOT NULL,
  clarification_deadline TIMESTAMPTZ,
  site_visit_date TIMESTAMPTZ,
  estimated_value NUMERIC(15, 2),
  tender_document_url TEXT,
  status tender_status NOT NULL DEFAULT 'discovered',
  raw_scraped_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. Qualification Results
-- ------------------------------------------------------------------------------
CREATE TABLE qualification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  eligible_agpo BOOLEAN NOT NULL DEFAULT false,
  score NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  matched_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_reasoning TEXT,
  recommendation qualification_recommendation NOT NULL DEFAULT 'borderline',
  reviewed_by_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 5. Applications
-- ------------------------------------------------------------------------------
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'drafting',
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{item, required, status, document_id}]
  submission_method submission_method NOT NULL DEFAULT 'online_portal',
  submission_deadline TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 6. Document Templates
-- ------------------------------------------------------------------------------
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  template_content TEXT NOT NULL,
  is_fixed_format BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 7. Generated Documents
-- ------------------------------------------------------------------------------
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  doc_type generated_doc_type NOT NULL,
  template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
  content TEXT,
  file_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status generated_doc_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 8. Agent Conversations
-- ------------------------------------------------------------------------------
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 9. Agent Messages
-- ------------------------------------------------------------------------------
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role agent_message_role NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 10. Tender Deadlines
-- ------------------------------------------------------------------------------
CREATE TABLE tender_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  deadline_type tender_deadline_type NOT NULL,
  deadline_at TIMESTAMPTZ NOT NULL,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_submission_deadline ON tenders(submission_deadline);
CREATE INDEX idx_applications_status ON applications(status);

-- Foreign Key Indexes for fast relational queries
CREATE INDEX idx_qualification_results_tender_id ON qualification_results(tender_id);
CREATE INDEX idx_applications_tender_id ON applications(tender_id);
CREATE INDEX idx_generated_documents_application_id ON generated_documents(application_id);
CREATE INDEX idx_generated_documents_template_id ON generated_documents(template_id);
CREATE INDEX idx_agent_messages_conversation_id ON agent_messages(conversation_id);
CREATE INDEX idx_tender_deadlines_tender_id ON tender_deadlines(tender_id);

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Scoped to Authenticated Users for Single-User System
-- ------------------------------------------------------------------------------
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to company_profile"
  ON company_profile FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to compliance_documents"
  ON compliance_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to tenders"
  ON tenders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to qualification_results"
  ON qualification_results FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to applications"
  ON applications FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to document_templates"
  ON document_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to generated_documents"
  ON generated_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to agent_conversations"
  ON agent_conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to agent_messages"
  ON agent_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to tender_deadlines"
  ON tender_deadlines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- Seed Default Company Profile Row (Single-User System)
-- ------------------------------------------------------------------------------
INSERT INTO company_profile (
  id,
  legal_name,
  agpo_category,
  core_services,
  past_projects,
  key_personnel
) VALUES (
  1,
  'Hisako Tech Solutions Ltd',
  'Youth',
  '["ICT Services", "Web Development", "Mobile App Development", "IT Consultation"]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;
