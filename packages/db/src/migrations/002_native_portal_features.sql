CREATE TYPE task_status AS ENUM ('open', 'in_progress', 'waiting_on_client', 'done', 'cancelled');
CREATE TYPE task_visibility AS ENUM ('internal', 'client_visible');
CREATE TYPE consultation_type AS ENUM (
  'initial_consultation',
  'follow_up_consultation',
  'medical_record_review',
  'evidence_organization',
  'medical_summary_service',
  'workshop',
  'academy_session'
);
CREATE TYPE attendance_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE slot_status AS ENUM ('open', 'booked', 'cancelled');
CREATE TYPE resource_type AS ENUM (
  'article',
  'video',
  'pdf',
  'checklist',
  'template',
  'faq',
  'quiz',
  'webinar',
  'course'
);
CREATE TYPE assigned_resource_status AS ENUM ('assigned', 'started', 'completed');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  assigned_to_user_id UUID REFERENCES user_accounts(id),
  visibility task_visibility NOT NULL DEFAULT 'client_visible',
  status task_status NOT NULL DEFAULT 'open',
  due_at TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by_user_id UUID NOT NULL REFERENCES user_accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  subject VARCHAR(300) NOT NULL,
  participant_user_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE message_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES user_accounts(id),
  body TEXT NOT NULL,
  contains_phi BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID NOT NULL REFERENCES user_accounts(id),
  consultation_type consultation_type NOT NULL DEFAULT 'initial_consultation',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status slot_status NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  availability_slot_id UUID REFERENCES availability_slots(id),
  staff_user_id UUID REFERENCES user_accounts(id),
  type consultation_type NOT NULL DEFAULT 'initial_consultation',
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  meeting_url TEXT,
  booking_source VARCHAR(32) NOT NULL DEFAULT 'portal',
  attendance_status attendance_status NOT NULL DEFAULT 'scheduled',
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE education_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) NOT NULL UNIQUE,
  title VARCHAR(300) NOT NULL,
  type resource_type NOT NULL DEFAULT 'article',
  category VARCHAR(120) NOT NULL DEFAULT 'general',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  access_level VARCHAR(32) NOT NULL DEFAULT 'client',
  estimated_minutes INTEGER,
  downloadable_asset_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assigned_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES education_resources(id) ON DELETE CASCADE,
  assigned_by_user_id UUID NOT NULL REFERENCES user_accounts(id),
  status assigned_resource_status NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (client_profile_id, resource_id)
);

CREATE INDEX idx_tasks_client_profile ON tasks(client_profile_id);
CREATE INDEX idx_message_threads_client_profile ON message_threads(client_profile_id);
CREATE INDEX idx_message_entries_thread ON message_entries(thread_id);
CREATE INDEX idx_availability_slots_starts_at ON availability_slots(starts_at);
CREATE INDEX idx_consultations_client_profile ON consultations(client_profile_id);
CREATE INDEX idx_assigned_resources_client_profile ON assigned_resources(client_profile_id);

INSERT INTO education_resources (slug, title, type, category, description, is_public, access_level, estimated_minutes) VALUES
  (
    'va-claim-evidence-checklist',
    'VA Claim Evidence Checklist',
    'checklist',
    'claims',
    'A practical checklist of common evidence types used to support VA disability claims.',
    FALSE,
    'client',
    15
  ),
  (
    'understanding-nexus-letters',
    'Understanding Nexus Letters',
    'article',
    'education',
    'Learn what a nexus letter is, when it may help, and what information providers typically need.',
    FALSE,
    'client',
    10
  ),
  (
    'document-upload-guide',
    'Document Upload Guide',
    'pdf',
    'portal',
    'How to prepare and upload medical records, decision letters, and supporting statements securely.',
    FALSE,
    'client',
    8
  );
