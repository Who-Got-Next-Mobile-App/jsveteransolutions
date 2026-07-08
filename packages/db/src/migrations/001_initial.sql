CREATE TYPE user_role AS ENUM ('client', 'assistant', 'owner');
CREATE TYPE claim_stage AS ENUM (
  'intake_received',
  'documents_requested',
  'records_uploaded',
  'records_under_review',
  'evidence_gaps_identified',
  'consultation_completed',
  'recommendations_provided',
  'resources_assigned',
  'follow_up_needed',
  'completed_closed'
);
CREATE TYPE document_type AS ENUM (
  'va_decision_letter',
  'dbq',
  'service_treatment_record',
  'private_medical_record',
  'nexus_letter',
  'lay_statement',
  'buddy_statement',
  'imaging_or_labs',
  'personal_injury_record',
  'attorney_letter',
  'intake_attachment',
  'other'
);
CREATE TYPE document_status AS ENUM (
  'pending_upload',
  'uploaded',
  'under_review',
  'additional_info_requested',
  'complete',
  'archived'
);

CREATE TABLE user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub VARCHAR(128) NOT NULL UNIQUE,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(32),
  role user_role NOT NULL DEFAULT 'client',
  display_name VARCHAR(200) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_account_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  preferred_name VARCHAR(100),
  date_of_birth VARCHAR(10),
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(32),
  address JSONB,
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(32),
  military_service JSONB NOT NULL DEFAULT '{}'::jsonb,
  claim_history_summary TEXT,
  claimed_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_stage claim_stage NOT NULL DEFAULT 'intake_received',
  assigned_owner_user_id UUID REFERENCES user_accounts(id),
  assigned_assistant_user_id UUID REFERENCES user_accounts(id),
  intake_completed_at TIMESTAMPTZ,
  last_portal_activity_at TIMESTAMPTZ,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES user_accounts(id),
  type document_type NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  s3_key VARCHAR(1024) NOT NULL,
  mime_type VARCHAR(200) NOT NULL,
  size_bytes INTEGER,
  checksum VARCHAR(128),
  service_date VARCHAR(10),
  status document_status NOT NULL DEFAULT 'pending_upload',
  review_notes TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES user_accounts(id),
  event_type VARCHAR(100) NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB,
  visible_to_client BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_profiles_user_account ON client_profiles(user_account_id);
CREATE INDEX idx_documents_client_profile ON documents(client_profile_id);
CREATE INDEX idx_timeline_client_profile ON timeline_events(client_profile_id);
