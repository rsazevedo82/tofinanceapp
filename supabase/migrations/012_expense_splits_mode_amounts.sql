-- ============================================================
-- Migration 012: Persistencia explicita para modos/valores de split
-- ============================================================

ALTER TABLE expense_splits
  ADD COLUMN IF NOT EXISTS split_mode TEXT NOT NULL DEFAULT 'equal',
  ADD COLUMN IF NOT EXISTS payer_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS partner_amount NUMERIC(12,2);

ALTER TABLE expense_splits
  DROP CONSTRAINT IF EXISTS expense_splits_split_mode_check;

ALTER TABLE expense_splits
  ADD CONSTRAINT expense_splits_split_mode_check
  CHECK (split_mode IN ('equal', 'manual'));

-- Backfill para registros antigos
UPDATE expense_splits
SET
  split_mode = CASE
    WHEN ABS(payer_share_percent - 50) < 0.0001 THEN 'equal'
    ELSE 'manual'
  END,
  payer_amount = ROUND(total_amount * payer_share_percent / 100.0, 2),
  partner_amount = ROUND(total_amount - ROUND(total_amount * payer_share_percent / 100.0, 2), 2)
WHERE payer_amount IS NULL
   OR partner_amount IS NULL;

ALTER TABLE expense_splits
  ALTER COLUMN payer_amount SET NOT NULL,
  ALTER COLUMN partner_amount SET NOT NULL;

ALTER TABLE expense_splits
  DROP CONSTRAINT IF EXISTS expense_splits_amounts_positive_check;

ALTER TABLE expense_splits
  ADD CONSTRAINT expense_splits_amounts_positive_check
  CHECK (payer_amount > 0 AND partner_amount > 0);

ALTER TABLE expense_splits
  DROP CONSTRAINT IF EXISTS expense_splits_amounts_total_check;

ALTER TABLE expense_splits
  ADD CONSTRAINT expense_splits_amounts_total_check
  CHECK (ABS((payer_amount + partner_amount) - total_amount) <= 0.01);
