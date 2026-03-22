-- 004_guardians.sql
-- Guardian circles relationship table

CREATE TABLE guardian_circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status guardian_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guardian_id)
);

CREATE INDEX idx_guardian_circles_user ON guardian_circles(user_id);
CREATE INDEX idx_guardian_circles_guardian ON guardian_circles(guardian_id);
CREATE INDEX idx_guardian_circles_status ON guardian_circles(status);
