-- Datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  samples_count INTEGER NOT NULL DEFAULT 0,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets (created_at DESC);

