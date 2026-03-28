-- ============================================================
-- Migration 010: Lookup indexado de auth.users por email
-- Objetivo: evitar listUsers() completo em convites de casal
-- ============================================================

-- Função restrita ao service_role para buscar user_id por e-mail
CREATE OR REPLACE FUNCTION public.find_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id
  FROM auth.users u
  WHERE lower(u.email) = lower(trim(p_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_auth_user_id_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_auth_user_id_by_email(text) FROM anon;
REVOKE ALL ON FUNCTION public.find_auth_user_id_by_email(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.find_auth_user_id_by_email(text) TO service_role;
