-- ============================================================
-- Migration 002: Cartao de credito, faturas e parcelamento
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Colunas especificas de cartao em accounts
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS credit_limit  NUMERIC(15,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closing_day   INTEGER       DEFAULT NULL CHECK (closing_day BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS due_day       INTEGER       DEFAULT NULL CHECK (due_day BETWEEN 1 AND 31);

-- 2. Faturas do cartao
CREATE TABLE IF NOT EXISTS credit_invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_month  VARCHAR(7) NOT NULL,        -- formato: "2026-03"
  status           TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','closed','paid')),
  due_date         DATE NOT NULL,
  total_amount     NUMERIC(15,2) NOT NULL DEFAULT 0,
  closed_at        TIMESTAMPTZ DEFAULT NULL,
  paid_at          TIMESTAMPTZ DEFAULT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, reference_month)
);

-- 3. Grupos de parcelamento
CREATE TABLE IF NOT EXISTS installment_groups (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id        UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  description       TEXT NOT NULL,
  total_amount      NUMERIC(15,2) NOT NULL,
  installment_count INTEGER NOT NULL CHECK (installment_count >= 2),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Colunas de parcelamento e fatura em transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS invoice_id           UUID REFERENCES credit_invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS installment_group_id UUID REFERENCES installment_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS installment_number   INTEGER DEFAULT NULL;

-- 5. Indices
CREATE INDEX IF NOT EXISTS idx_credit_invoices_account
  ON credit_invoices (account_id, status);

CREATE INDEX IF NOT EXISTS idx_credit_invoices_user
  ON credit_invoices (user_id, reference_month);

CREATE INDEX IF NOT EXISTS idx_installment_groups_user
  ON installment_groups (user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_invoice
  ON transactions (invoice_id)
  WHERE invoice_id IS NOT NULL;

-- 6. RLS em credit_invoices
ALTER TABLE credit_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_own" ON credit_invoices;
CREATE POLICY "invoices_select_own" ON credit_invoices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_insert_own" ON credit_invoices;
CREATE POLICY "invoices_insert_own" ON credit_invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_update_own" ON credit_invoices;
CREATE POLICY "invoices_update_own" ON credit_invoices
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. RLS em installment_groups
ALTER TABLE installment_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "installments_select_own" ON installment_groups;
CREATE POLICY "installments_select_own" ON installment_groups
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "installments_insert_own" ON installment_groups;
CREATE POLICY "installments_insert_own" ON installment_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);