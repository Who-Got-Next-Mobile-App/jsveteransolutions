CREATE TYPE referral_category AS ENUM (
  'realtor',
  'attorney',
  'educator',
  'developer',
  'other'
);

CREATE TYPE referral_submission_status AS ENUM (
  'pending',
  'reviewed',
  'archived'
);

CREATE TYPE referral_communication_preference AS ENUM (
  'text',
  'call',
  'either'
);

CREATE TABLE referral_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(200) NOT NULL,
  category referral_category NOT NULL,
  contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  communication_preference referral_communication_preference NOT NULL DEFAULT 'either',
  communication_notes TEXT,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_area TEXT NOT NULL,
  email VARCHAR(320),
  website_url VARCHAR(500),
  notes TEXT,
  disclaimer_accepted_at TIMESTAMPTZ NOT NULL,
  status referral_submission_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by_user_id UUID REFERENCES user_accounts(id)
);

CREATE INDEX idx_referral_submissions_status ON referral_submissions(status);
CREATE INDEX idx_referral_submissions_category ON referral_submissions(category);
CREATE INDEX idx_referral_submissions_created_at ON referral_submissions(created_at DESC);
