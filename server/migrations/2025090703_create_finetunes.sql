-- Minimal finetunes table
CREATE TABLE IF NOT EXISTS finetunes (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

