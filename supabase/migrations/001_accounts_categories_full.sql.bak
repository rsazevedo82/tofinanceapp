-- ============================================================
-- Migration 001: Suporte completo a contas e categorias
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Adiciona deleted_at em categories (já existe em accounts)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Garante que transactions tem deleted_at
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Índices para soft delete (ignora registros deletados nas queries)
CREATE INDEX IF NOT EXISTS idx_accounts_active
  ON accounts (user_id, is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_categories_active
  ON categories (is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions (user_id, date DESC)
  WHERE deleted_at IS NULL;

-- 4. RLS: garante que usuário só vê suas próprias contas
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts_select_own" ON accounts;
CREATE POLICY "accounts_select_own" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_insert_own" ON accounts;
CREATE POLICY "accounts_insert_own" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_update_own" ON accounts;
CREATE POLICY "accounts_update_own" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. RLS: categorias do sistema (user_id IS NULL) são visíveis para todos
--    categorias do usuário só para ele
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_insert_own" ON categories;
CREATE POLICY "categories_insert_own" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_update_own" ON categories;
CREATE POLICY "categories_update_own" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. RLS: transações
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
CREATE POLICY "transactions_insert_own" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
CREATE POLICY "transactions_update_own" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Seed de categorias do sistema (user_id IS NULL)
--    Só insere se não existir (idempotente)
INSERT INTO categories (name, type, color, is_active) VALUES
  -- Receitas
  ('Salário',           'income',  '#6ee7b7', true),
  ('Freelance',         'income',  '#34d399', true),
  ('Investimentos',     'income',  '#10b981', true),
  ('Presente',          'income',  '#a7f3d0', true),
  ('Outros (Receita)',  'income',  '#d1fae5', true),
  -- Despesas
  ('Alimentação',       'expense', '#fca5a5', true),
  ('Moradia',           'expense', '#f87171', true),
  ('Transporte',        'expense', '#fb923c', true),
  ('Saúde',             'expense', '#fbbf24', true),
  ('Educação',          'expense', '#a78bfa', true),
  ('Lazer',             'expense', '#60a5fa', true),
  ('Vestuário',         'expense', '#f472b6', true),
  ('Assinaturas',       'expense', '#94a3b8', true),
  ('Outros (Despesa)',  'expense', '#cbd5e1', true)
ON CONFLICT DO NOTHING;
