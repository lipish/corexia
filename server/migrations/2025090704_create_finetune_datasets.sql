-- Link table between finetunes and datasets
CREATE TABLE IF NOT EXISTS finetune_datasets (
  finetune_id UUID NOT NULL REFERENCES finetunes(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (finetune_id, dataset_id)
);

