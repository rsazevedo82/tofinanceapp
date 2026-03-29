-- ============================================================
-- Migration 013: Vinculo automatico entre transacoes e divisao
-- ============================================================

ALTER TABLE expense_splits
  ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_expense_splits_transaction_unique
  ON expense_splits (transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expense_splits_transaction
  ON expense_splits (transaction_id);
