-- 007_place_cache.sql
-- Cache for Overpass API nearby place searches

CREATE TABLE place_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  places JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_place_cache_key ON place_cache(cache_key);
CREATE INDEX idx_place_cache_expires ON place_cache(expires_at);
