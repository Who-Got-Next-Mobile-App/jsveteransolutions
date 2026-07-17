ALTER TABLE user_accounts
  ADD COLUMN accepting_clients BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN last_client_assigned_at TIMESTAMPTZ;

CREATE TYPE provider_invite_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');

CREATE TABLE provider_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(320) NOT NULL,
  token VARCHAR(128) NOT NULL UNIQUE,
  invited_by_user_id UUID NOT NULL REFERENCES user_accounts(id),
  status provider_invite_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_user_id UUID REFERENCES user_accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_invites_email ON provider_invites(email);
CREATE INDEX idx_provider_invites_status ON provider_invites(status);
CREATE INDEX idx_client_profiles_assigned_assistant ON client_profiles(assigned_assistant_user_id);
CREATE INDEX idx_user_accounts_accepting_clients ON user_accounts(accepting_clients);
