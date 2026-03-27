-- ============================================================
-- Migration 009: Auditoria de eventos sensiveis
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  status      TEXT        NOT NULL CHECK (status IN ('success', 'failure')),
  target_type TEXT,
  target_id   TEXT,
  ip          TEXT,
  user_agent  TEXT,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_user_created_at
  ON audit_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_action_created_at
  ON audit_events (action, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Sem policy de INSERT/UPDATE/DELETE para client:
-- auditoria e gravada apenas no backend com service_role.
DROP POLICY IF EXISTS "audit_events_select_own" ON audit_events;
CREATE POLICY "audit_events_select_own" ON audit_events
  FOR SELECT USING (auth.uid() = user_id);
