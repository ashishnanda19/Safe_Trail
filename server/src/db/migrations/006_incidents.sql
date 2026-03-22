-- 006_incidents.sql
-- Community incident reporting table

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

-- GIST index for fast geospatial queries (ST_DWithin, ST_Within, etc.)
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_occurred_at ON incidents(occurred_at DESC);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
