-- ============================================================
-- Migration 014: KPIs de casal com snapshot diario materializado
-- ============================================================

CREATE TABLE IF NOT EXISTS couple_kpi_snapshots (
  snapshot_date                               DATE          NOT NULL,
  cohort_window_days                          INTEGER       NOT NULL DEFAULT 30,
  users_created                               INTEGER       NOT NULL DEFAULT 0,
  users_linked_d7                             INTEGER       NOT NULL DEFAULT 0,
  users_linked_d7_pct                         NUMERIC(5,2)  NOT NULL DEFAULT 0,
  couples_linked                              INTEGER       NOT NULL DEFAULT 0,
  couples_with_first_split_d7                 INTEGER       NOT NULL DEFAULT 0,
  couples_first_split_d7_pct                  NUMERIC(5,2)  NOT NULL DEFAULT 0,
  expense_transactions                         INTEGER       NOT NULL DEFAULT 0,
  expense_transactions_split_linked            INTEGER       NOT NULL DEFAULT 0,
  expense_transactions_split_linked_pct        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  generated_at                                TIMESTAMPTZ   NOT NULL DEFAULT now(),
  PRIMARY KEY (snapshot_date, cohort_window_days)
);

CREATE OR REPLACE FUNCTION refresh_couple_kpis_snapshot(
  p_snapshot_date DATE DEFAULT CURRENT_DATE,
  p_window_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  snapshot_date DATE,
  cohort_window_days INTEGER,
  users_created INTEGER,
  users_linked_d7 INTEGER,
  users_linked_d7_pct NUMERIC(5,2),
  couples_linked INTEGER,
  couples_with_first_split_d7 INTEGER,
  couples_first_split_d7_pct NUMERIC(5,2),
  expense_transactions INTEGER,
  expense_transactions_split_linked INTEGER,
  expense_transactions_split_linked_pct NUMERIC(5,2),
  generated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_days INTEGER := GREATEST(COALESCE(p_window_days, 30), 1);
  v_snapshot_date DATE := COALESCE(p_snapshot_date, CURRENT_DATE);
  v_start_date DATE := v_snapshot_date - (v_window_days - 1);
BEGIN
  RETURN QUERY
  WITH
  users_in_window AS (
    SELECT
      u.id,
      u.created_at
    FROM auth.users u
    WHERE u.created_at::date BETWEEN v_start_date AND v_snapshot_date
  ),
  users_linked_in_7d AS (
    SELECT COUNT(*)::INTEGER AS count
    FROM users_in_window u
    WHERE EXISTS (
      SELECT 1
      FROM couple_profiles cp
      WHERE (cp.user_id_1 = u.id OR cp.user_id_2 = u.id)
        AND cp.linked_at <= (u.created_at + INTERVAL '7 days')
    )
  ),
  users_total AS (
    SELECT COUNT(*)::INTEGER AS count FROM users_in_window
  ),
  couples_in_window AS (
    SELECT
      cp.id,
      cp.linked_at
    FROM couple_profiles cp
    WHERE cp.linked_at::date BETWEEN v_start_date AND v_snapshot_date
  ),
  couples_total AS (
    SELECT COUNT(*)::INTEGER AS count FROM couples_in_window
  ),
  couples_first_split_in_7d AS (
    SELECT COUNT(*)::INTEGER AS count
    FROM couples_in_window c
    WHERE EXISTS (
      SELECT 1
      FROM expense_splits es
      WHERE es.couple_id = c.id
      GROUP BY es.couple_id
      HAVING MIN(es.created_at) <= (c.linked_at + INTERVAL '7 days')
    )
  ),
  expense_tx AS (
    SELECT COUNT(*)::INTEGER AS count
    FROM transactions t
    WHERE t.type = 'expense'
      AND t.deleted_at IS NULL
      AND t.date BETWEEN v_start_date AND v_snapshot_date
  ),
  expense_tx_linked AS (
    SELECT COUNT(*)::INTEGER AS count
    FROM transactions t
    JOIN expense_splits es ON es.transaction_id = t.id
    WHERE t.type = 'expense'
      AND t.deleted_at IS NULL
      AND t.date BETWEEN v_start_date AND v_snapshot_date
  ),
  base_metrics AS (
    SELECT
      v_snapshot_date AS snapshot_date,
      v_window_days AS cohort_window_days,
      ut.count AS users_created,
      ul.count AS users_linked_d7,
      CASE
        WHEN ut.count > 0 THEN ROUND((ul.count::NUMERIC * 100.0) / ut.count, 2)
        ELSE 0
      END::NUMERIC(5,2) AS users_linked_d7_pct,
      ct.count AS couples_linked,
      cfs.count AS couples_with_first_split_d7,
      CASE
        WHEN ct.count > 0 THEN ROUND((cfs.count::NUMERIC * 100.0) / ct.count, 2)
        ELSE 0
      END::NUMERIC(5,2) AS couples_first_split_d7_pct,
      et.count AS expense_transactions,
      etl.count AS expense_transactions_split_linked,
      CASE
        WHEN et.count > 0 THEN ROUND((etl.count::NUMERIC * 100.0) / et.count, 2)
        ELSE 0
      END::NUMERIC(5,2) AS expense_transactions_split_linked_pct,
      now() AS generated_at
    FROM users_total ut
    CROSS JOIN users_linked_in_7d ul
    CROSS JOIN couples_total ct
    CROSS JOIN couples_first_split_in_7d cfs
    CROSS JOIN expense_tx et
    CROSS JOIN expense_tx_linked etl
  ),
  upserted AS (
    INSERT INTO couple_kpi_snapshots (
      snapshot_date,
      cohort_window_days,
      users_created,
      users_linked_d7,
      users_linked_d7_pct,
      couples_linked,
      couples_with_first_split_d7,
      couples_first_split_d7_pct,
      expense_transactions,
      expense_transactions_split_linked,
      expense_transactions_split_linked_pct,
      generated_at
    )
    SELECT
      snapshot_date,
      cohort_window_days,
      users_created,
      users_linked_d7,
      users_linked_d7_pct,
      couples_linked,
      couples_with_first_split_d7,
      couples_first_split_d7_pct,
      expense_transactions,
      expense_transactions_split_linked,
      expense_transactions_split_linked_pct,
      generated_at
    FROM base_metrics
    ON CONFLICT (snapshot_date, cohort_window_days)
    DO UPDATE SET
      users_created = EXCLUDED.users_created,
      users_linked_d7 = EXCLUDED.users_linked_d7,
      users_linked_d7_pct = EXCLUDED.users_linked_d7_pct,
      couples_linked = EXCLUDED.couples_linked,
      couples_with_first_split_d7 = EXCLUDED.couples_with_first_split_d7,
      couples_first_split_d7_pct = EXCLUDED.couples_first_split_d7_pct,
      expense_transactions = EXCLUDED.expense_transactions,
      expense_transactions_split_linked = EXCLUDED.expense_transactions_split_linked,
      expense_transactions_split_linked_pct = EXCLUDED.expense_transactions_split_linked_pct,
      generated_at = EXCLUDED.generated_at
    RETURNING
      couple_kpi_snapshots.snapshot_date,
      couple_kpi_snapshots.cohort_window_days,
      couple_kpi_snapshots.users_created,
      couple_kpi_snapshots.users_linked_d7,
      couple_kpi_snapshots.users_linked_d7_pct,
      couple_kpi_snapshots.couples_linked,
      couple_kpi_snapshots.couples_with_first_split_d7,
      couple_kpi_snapshots.couples_first_split_d7_pct,
      couple_kpi_snapshots.expense_transactions,
      couple_kpi_snapshots.expense_transactions_split_linked,
      couple_kpi_snapshots.expense_transactions_split_linked_pct,
      couple_kpi_snapshots.generated_at
  )
  SELECT * FROM upserted;
END;
$$;
