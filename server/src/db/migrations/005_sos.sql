-- 005_sos.sql
-- SOS events, location pings, and alerts log tables

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

-- Indexes
CREATE INDEX idx_sos_events_user ON sos_events(user_id);
CREATE INDEX idx_sos_events_status ON sos_events(status);
CREATE INDEX idx_sos_events_triggered_at ON sos_events(triggered_at DESC);
CREATE INDEX idx_location_pings_sos ON location_pings(sos_event_id);
CREATE INDEX idx_location_pings_pinged_at ON location_pings(pinged_at DESC);
CREATE INDEX idx_alerts_log_sos ON alerts_log(sos_event_id);
CREATE INDEX idx_alerts_log_status ON alerts_log(status);
