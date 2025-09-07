-- Samples per dataset
CREATE TABLE IF NOT EXISTS dataset_samples (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dataset_samples_dataset_id ON dataset_samples (dataset_id);

