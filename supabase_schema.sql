-- GuardianCircle - Supabase Schema Initialization
-- Paste this entire script into the Supabase SQL Editor and run it.

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Enums
CREATE TYPE user_role AS ENUM ('user', 'volunteer', 'admin');
CREATE TYPE sos_status AS ENUM ('active', 'resolved', 'false_alarm');
CREATE TYPE guardian_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE alert_channel AS ENUM ('sms', 'push', 'email');
CREATE TYPE alert_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE incident_category AS ENUM ('harassment', 'stalking', 'assault', 'unsafe_area', 'other');

-- 3. Utility Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role DEFAULT 'user',
  last_location GEOMETRY(Point, 4326),
  fcm_token TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guardian_circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status guardian_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guardian_id)
);

CREATE TABLE sos_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  triggered_location GEOMETRY(Point, 4326) NOT NULL,
  status sos_status DEFAULT 'active',
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE location_pings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sos_event_id UUID REFERENCES sos_events(id) ON DELETE CASCADE,
  coordinates GEOMETRY(Point, 4326) NOT NULL,
  accuracy FLOAT,
  pinged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alerts_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sos_event_id UUID REFERENCES sos_events(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel alert_channel NOT NULL,
  status alert_status DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  location GEOMETRY(Point, 4326) NOT NULL,
  category incident_category NOT NULL,
  description TEXT,
  anonymous BOOLEAN DEFAULT false,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE place_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  places JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE voice_sos_settings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_enabled   BOOLEAN DEFAULT false,
  sensitivity  VARCHAR(10) DEFAULT 'medium'
                 CHECK (sensitivity IN ('low', 'medium', 'high')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE voice_keywords (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  keyword    VARCHAR(100) NOT NULL,
  language   VARCHAR(10) DEFAULT 'en-IN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, keyword)
);

CREATE TABLE voice_trigger_log (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  detected_keyword VARCHAR(100),
  confidence       FLOAT,
  triggered_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evidence_recordings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sos_event_id  UUID REFERENCES sos_events(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  file_path     TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  file_size     BIGINT,
  mime_type     VARCHAR(50),
  duration_secs INT,
  chunk_index   INT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_location ON users USING GIST(last_location);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_guardian_circles_user ON guardian_circles(user_id);
CREATE INDEX idx_guardian_circles_guardian ON guardian_circles(guardian_id);
CREATE INDEX idx_guardian_circles_status ON guardian_circles(status);
CREATE INDEX idx_sos_events_user ON sos_events(user_id);
CREATE INDEX idx_sos_events_status ON sos_events(status);
CREATE INDEX idx_sos_events_triggered_at ON sos_events(triggered_at DESC);
CREATE INDEX idx_location_pings_sos ON location_pings(sos_event_id);
CREATE INDEX idx_location_pings_pinged_at ON location_pings(pinged_at DESC);
CREATE INDEX idx_alerts_log_sos ON alerts_log(sos_event_id);
CREATE INDEX idx_alerts_log_status ON alerts_log(status);
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_occurred_at ON incidents(occurred_at DESC);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_place_cache_key ON place_cache(cache_key);
CREATE INDEX idx_place_cache_expires ON place_cache(expires_at);
CREATE INDEX idx_voice_trigger_log_user ON voice_trigger_log(user_id);
CREATE INDEX idx_evidence_sos  ON evidence_recordings(sos_event_id);
CREATE INDEX idx_evidence_user ON evidence_recordings(user_id);

-- 6. Triggers
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER voice_sos_settings_updated_at
  BEFORE UPDATE ON voice_sos_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
