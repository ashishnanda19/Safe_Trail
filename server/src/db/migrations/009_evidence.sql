-- ─── Evidence Recordings ────────────────────────────────────────────────────────
-- TODO (production): add virus scanning before storing files
CREATE TABLE IF NOT EXISTS evidence_recordings (
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

CREATE INDEX IF NOT EXISTS idx_evidence_sos  ON evidence_recordings(sos_event_id);
CREATE INDEX IF NOT EXISTS idx_evidence_user ON evidence_recordings(user_id);
