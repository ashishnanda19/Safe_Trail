-- ─── Voice SOS Settings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voice_sos_settings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_enabled   BOOLEAN DEFAULT false,
  sensitivity  VARCHAR(10) DEFAULT 'medium'
                 CHECK (sensitivity IN ('low', 'medium', 'high')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Voice Keywords ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voice_keywords (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  keyword    VARCHAR(100) NOT NULL,
  language   VARCHAR(10) DEFAULT 'en-IN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, keyword)
);

-- ─── Voice Trigger Log ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voice_trigger_log (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  detected_keyword VARCHAR(100),
  confidence       FLOAT,
  triggered_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_trigger_log_user ON voice_trigger_log(user_id);
