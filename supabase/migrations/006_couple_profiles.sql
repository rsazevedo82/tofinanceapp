-- ============================================================
-- Migration 006: Perfil de Casal
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── 1. Par vinculado (criado ANTES de user_profiles por ser referenciado) ─────

CREATE TABLE IF NOT EXISTS couple_profiles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT couple_order  CHECK (user_id_1 < user_id_2),
  CONSTRAINT couple_unique UNIQUE (user_id_1, user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_couple_profiles_user1 ON couple_profiles (user_id_1);
CREATE INDEX IF NOT EXISTS idx_couple_profiles_user2 ON couple_profiles (user_id_2);

ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "couple_profiles_select_own" ON couple_profiles;
CREATE POLICY "couple_profiles_select_own" ON couple_profiles
  FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- ── 2. Perfis de usuário ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_upsert_own" ON user_profiles;
CREATE POLICY "user_profiles_upsert_own" ON user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Parceiro vinculado também pode ver o perfil do outro
DROP POLICY IF EXISTS "user_profiles_select_partner" ON user_profiles;
CREATE POLICY "user_profiles_select_partner" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_profiles cp
      WHERE (cp.user_id_1 = auth.uid() AND cp.user_id_2 = user_profiles.id)
         OR (cp.user_id_2 = auth.uid() AND cp.user_id_1 = user_profiles.id)
    )
  );

-- ── 3. Convites ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS couple_invitations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT        NOT NULL,
  invitee_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  token         TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status        TEXT        NOT NULL DEFAULT 'pending',
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT invitation_status CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_couple_invitations_inviter ON couple_invitations (inviter_id);
CREATE INDEX IF NOT EXISTS idx_couple_invitations_invitee ON couple_invitations (invitee_id);
CREATE INDEX IF NOT EXISTS idx_couple_invitations_token   ON couple_invitations (token);
CREATE INDEX IF NOT EXISTS idx_couple_invitations_pending ON couple_invitations (invitee_email)
  WHERE status = 'pending';

ALTER TABLE couple_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "couple_invitations_select_inviter" ON couple_invitations;
CREATE POLICY "couple_invitations_select_inviter" ON couple_invitations
  FOR SELECT USING (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "couple_invitations_select_invitee" ON couple_invitations;
CREATE POLICY "couple_invitations_select_invitee" ON couple_invitations
  FOR SELECT USING (auth.uid() = invitee_id);

-- ── 4. RLS cross-user: parceiro lê transactions após linked_at ────────────────

DROP POLICY IF EXISTS "transactions_select_partner" ON transactions;
CREATE POLICY "transactions_select_partner" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_profiles cp
      WHERE (
        (cp.user_id_1 = auth.uid() AND cp.user_id_2 = transactions.user_id) OR
        (cp.user_id_2 = auth.uid() AND cp.user_id_1 = transactions.user_id)
      )
      AND transactions.date >= cp.linked_at::date
    )
  );

-- ── 5. RLS cross-user: parceiro lê accounts ──────────────────────────────────

DROP POLICY IF EXISTS "accounts_select_partner" ON accounts;
CREATE POLICY "accounts_select_partner" ON accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_profiles cp
      WHERE (cp.user_id_1 = auth.uid() AND cp.user_id_2 = accounts.user_id)
         OR (cp.user_id_2 = auth.uid() AND cp.user_id_1 = accounts.user_id)
    )
  );

-- ── 6. RLS cross-user: parceiro lê categories ────────────────────────────────

DROP POLICY IF EXISTS "categories_select_partner" ON categories;
CREATE POLICY "categories_select_partner" ON categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couple_profiles cp
      WHERE (cp.user_id_1 = auth.uid() AND cp.user_id_2 = categories.user_id)
         OR (cp.user_id_2 = auth.uid() AND cp.user_id_1 = categories.user_id)
    )
  );

-- ── 7. Trigger: cria user_profile automaticamente ao criar usuário ────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
