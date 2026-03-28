-- ============================================================
-- Migration 011: Agregações SQL para endpoint de relatórios
-- Objetivo: reduzir CPU no Node e payload das consultas
-- ============================================================

CREATE OR REPLACE FUNCTION public.report_expense_by_category(
  p_user_id uuid,
  p_start date,
  p_end date
)
RETURNS TABLE (
  category_id uuid,
  category_name text,
  category_color text,
  total numeric,
  tx_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.category_id,
    COALESCE(c.name, 'Sem categoria') AS category_name,
    COALESCE(c.color, '#94a3b8') AS category_color,
    SUM(t.amount)::numeric AS total,
    COUNT(*)::bigint AS tx_count
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  WHERE t.user_id = p_user_id
    AND auth.uid() = p_user_id
    AND t.status = 'confirmed'
    AND t.deleted_at IS NULL
    AND t.type = 'expense'
    AND t.date >= p_start
    AND t.date <= p_end
  GROUP BY t.category_id, c.name, c.color
  ORDER BY SUM(t.amount) DESC;
$$;

CREATE OR REPLACE FUNCTION public.report_monthly_totals(
  p_user_id uuid,
  p_start date,
  p_end date
)
RETURNS TABLE (
  month text,
  income numeric,
  expense numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(date_trunc('month', t.date::date), 'YYYY-MM') AS month,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric AS income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric AS expense
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND auth.uid() = p_user_id
    AND t.status = 'confirmed'
    AND t.deleted_at IS NULL
    AND t.date >= p_start
    AND t.date <= p_end
  GROUP BY date_trunc('month', t.date::date)
  ORDER BY date_trunc('month', t.date::date);
$$;

CREATE OR REPLACE FUNCTION public.report_daily_totals(
  p_user_id uuid,
  p_start date,
  p_end date
)
RETURNS TABLE (
  day text,
  income numeric,
  expense numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(t.date::date, 'YYYY-MM-DD') AS day,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric AS income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric AS expense
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND auth.uid() = p_user_id
    AND t.status = 'confirmed'
    AND t.deleted_at IS NULL
    AND t.date >= p_start
    AND t.date <= p_end
  GROUP BY t.date::date
  ORDER BY t.date::date;
$$;

CREATE OR REPLACE FUNCTION public.report_card_limits(
  p_user_id uuid
)
RETURNS TABLE (
  account_id uuid,
  name text,
  color text,
  credit_limit numeric,
  used numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id AS account_id,
    a.name,
    a.color,
    a.credit_limit::numeric AS credit_limit,
    COALESCE(SUM(ci.total_amount), 0)::numeric AS used
  FROM accounts a
  LEFT JOIN credit_invoices ci
    ON ci.account_id = a.id
   AND ci.user_id = p_user_id
   AND ci.status <> 'paid'
  WHERE a.user_id = p_user_id
    AND auth.uid() = p_user_id
    AND a.type = 'credit'
    AND a.is_active = true
    AND a.deleted_at IS NULL
    AND a.credit_limit IS NOT NULL
  GROUP BY a.id, a.name, a.color, a.credit_limit
  ORDER BY a.name;
$$;

REVOKE ALL ON FUNCTION public.report_expense_by_category(uuid, date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_monthly_totals(uuid, date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_daily_totals(uuid, date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_card_limits(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.report_expense_by_category(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_monthly_totals(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_daily_totals(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_card_limits(uuid) TO authenticated;
