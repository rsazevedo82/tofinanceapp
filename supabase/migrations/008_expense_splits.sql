-- ============================================================
-- Migration 008: Split de Despesas
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS expense_splits (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id           UUID          NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  payer_id            UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description         TEXT          NOT NULL,
  date                DATE          NOT NULL DEFAULT CURRENT_DATE,
  total_amount        NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
  payer_share_percent NUMERIC(5,2)  NOT NULL DEFAULT 50.00
                                    CHECK (payer_share_percent > 0 AND payer_share_percent < 100),
  status              TEXT          NOT NULL DEFAULT 'pending',
  settled_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT split_status CHECK (status IN ('pending', 'settled'))
);

-- Campos computados são derivados no client/API:
--   payer_amount  = total_amount * payer_share_percent / 100
--   partner_amount = total_amount * (100 - payer_share_percent) / 100

CREATE INDEX IF NOT EXISTS idx_expense_splits_couple  ON expense_splits (couple_id, status, date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_splits_payer   ON expense_splits (payer_id);

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Ambos os parceiros do casal podem ler
DROP POLICY IF EXISTS "expense_splits_select" ON expense_splits;
CREATE POLICY "expense_splits_select" ON expense_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_profiles cp
      WHERE cp.id = expense_splits.couple_id
        AND (cp.user_id_1 = auth.uid() OR cp.user_id_2 = auth.uid())
    )
  );

-- Qualquer parceiro pode criar um split no casal
DROP POLICY IF EXISTS "expense_splits_insert" ON expense_splits;
CREATE POLICY "expense_splits_insert" ON expense_splits
  FOR INSERT WITH CHECK (
    auth.uid() = payer_id
    AND EXISTS (
      SELECT 1 FROM couple_profiles cp
      WHERE cp.id = expense_splits.couple_id
        AND (cp.user_id_1 = auth.uid() OR cp.user_id_2 = auth.uid())
    )
  );

-- Ambos os parceiros podem atualizar (quitar) um split
DROP POLICY IF EXISTS "expense_splits_update" ON expense_splits;
CREATE POLICY "expense_splits_update" ON expense_splits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM couple_profiles cp
      WHERE cp.id = expense_splits.couple_id
        AND (cp.user_id_1 = auth.uid() OR cp.user_id_2 = auth.uid())
    )
  );

-- Apenas o criador pode deletar, e só se ainda pendente
DROP POLICY IF EXISTS "expense_splits_delete" ON expense_splits;
CREATE POLICY "expense_splits_delete" ON expense_splits
  FOR DELETE USING (
    auth.uid() = payer_id
    AND status = 'pending'
  );

-- ── Trigger: atualiza updated_at ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_split_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS split_updated_at ON expense_splits;
CREATE TRIGGER split_updated_at
  BEFORE UPDATE ON expense_splits
  FOR EACH ROW EXECUTE FUNCTION update_split_timestamp();
