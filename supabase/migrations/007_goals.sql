-- ============================================================
-- Migration 007: Objetivos Financeiros
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── 1. Metas ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id     UUID        REFERENCES couple_profiles(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  icon          TEXT        NOT NULL DEFAULT '⭐',
  color         TEXT        NOT NULL DEFAULT '#818cf8',
  category      TEXT        NOT NULL DEFAULT 'custom',
  account_id    UUID        REFERENCES accounts(id) ON DELETE SET NULL,
  target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  deadline      DATE,
  status        TEXT        NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT goal_status CHECK (status IN ('active', 'completed', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_goals_user     ON goals (user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_couple   ON goals (couple_id, status) WHERE couple_id IS NOT NULL;

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Dono vê suas metas
DROP POLICY IF EXISTS "goals_select_own" ON goals;
CREATE POLICY "goals_select_own" ON goals
  FOR SELECT USING (auth.uid() = user_id);

-- Dono cria, edita e arquiva suas metas
DROP POLICY IF EXISTS "goals_insert_own" ON goals;
CREATE POLICY "goals_insert_own" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_update_own" ON goals;
CREATE POLICY "goals_update_own" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_delete_own" ON goals;
CREATE POLICY "goals_delete_own" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- Parceiro vê metas individuais e de casal (somente leitura)
DROP POLICY IF EXISTS "goals_select_partner" ON goals;
CREATE POLICY "goals_select_partner" ON goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_profiles cp
      WHERE (cp.user_id_1 = auth.uid() AND cp.user_id_2 = goals.user_id)
         OR (cp.user_id_2 = auth.uid() AND cp.user_id_1 = goals.user_id)
    )
  );

-- ── 2. Aportes ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goal_contributions (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID          NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id    UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  notes      TEXT,
  date       DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal ON goal_contributions (goal_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_user ON goal_contributions (user_id);

ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- Dono do aporte vê seus aportes
DROP POLICY IF EXISTS "goal_contributions_select_own" ON goal_contributions;
CREATE POLICY "goal_contributions_select_own" ON goal_contributions
  FOR SELECT USING (auth.uid() = user_id);

-- Qualquer pessoa com acesso à meta vê os aportes dela
DROP POLICY IF EXISTS "goal_contributions_select_goal" ON goal_contributions;
CREATE POLICY "goal_contributions_select_goal" ON goal_contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM goals g
      WHERE g.id = goal_contributions.goal_id
        AND (
          g.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM couple_profiles cp
            WHERE (cp.user_id_1 = auth.uid() AND cp.user_id_2 = g.user_id)
               OR (cp.user_id_2 = auth.uid() AND cp.user_id_1 = g.user_id)
          )
        )
    )
  );

-- Qualquer parceiro pode contribuir em metas de casal; apenas dono em metas individuais
DROP POLICY IF EXISTS "goal_contributions_insert" ON goal_contributions;
CREATE POLICY "goal_contributions_insert" ON goal_contributions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM goals g
      WHERE g.id = goal_contributions.goal_id
        AND (
          g.user_id = auth.uid()
          OR (
            g.couple_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM couple_profiles cp
              WHERE cp.id = g.couple_id
                AND (cp.user_id_1 = auth.uid() OR cp.user_id_2 = auth.uid())
            )
          )
        )
    )
  );

-- Dono do aporte pode remover o seu
DROP POLICY IF EXISTS "goal_contributions_delete_own" ON goal_contributions;
CREATE POLICY "goal_contributions_delete_own" ON goal_contributions
  FOR DELETE USING (auth.uid() = user_id);

-- ── 3. Trigger: atualiza updated_at em goals ──────────────────────────────────

CREATE OR REPLACE FUNCTION update_goal_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS goal_updated_at ON goals;
CREATE TRIGGER goal_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_goal_timestamp();
