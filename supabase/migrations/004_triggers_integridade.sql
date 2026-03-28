-- ============================================================
-- Migration 004: Triggers de integridade de dados
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── 1. Trigger de saldo de conta ─────────────────────────────────────────────
-- Recalcula accounts.balance automaticamente sempre que uma
-- transacao e inserida, atualizada ou deletada (soft delete incluido)

CREATE OR REPLACE FUNCTION recalculate_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_id UUID;
  v_new_balance NUMERIC(15,2);
BEGIN
  -- Determina qual account_id foi afetado
  IF TG_OP = 'DELETE' THEN
    v_account_id := OLD.account_id;
  ELSE
    v_account_id := NEW.account_id;
    -- Se mudou de conta, recalcula a conta antiga tambem
    IF TG_OP = 'UPDATE' AND OLD.account_id != NEW.account_id THEN
      SELECT COALESCE(SUM(
        CASE
          WHEN type = 'income'   THEN  amount
          WHEN type = 'expense'  THEN -amount
          ELSE 0
        END
      ), 0)
      INTO v_new_balance
      FROM transactions
      WHERE account_id = OLD.account_id
        AND deleted_at IS NULL
        AND status = 'confirmed';

      UPDATE accounts
      SET balance    = v_new_balance,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    END IF;
  END IF;

  -- Recalcula saldo da conta afetada
  -- Cartoes de credito NAO tem saldo calculado por transacoes
  -- (o saldo deles e gerenciado pelas faturas)
  IF EXISTS (
    SELECT 1 FROM accounts
    WHERE id = v_account_id AND type != 'credit'
  ) THEN
    SELECT COALESCE(SUM(
      CASE
        WHEN type = 'income'   THEN  amount
        WHEN type = 'expense'  THEN -amount
        ELSE 0
      END
    ), 0)
    INTO v_new_balance
    FROM transactions
    WHERE account_id = v_account_id
      AND deleted_at IS NULL
      AND status     = 'confirmed';

    UPDATE accounts
    SET balance    = v_new_balance,
        updated_at = NOW()
    WHERE id = v_account_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Remove trigger antigo se existir
DROP TRIGGER IF EXISTS trg_recalculate_account_balance ON transactions;

-- Cria trigger para INSERT, UPDATE e DELETE
CREATE TRIGGER trg_recalculate_account_balance
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION recalculate_account_balance();


-- ── 2. Trigger de total de fatura ─────────────────────────────────────────────
-- Recalcula credit_invoices.total_amount sempre que uma transacao
-- vinculada a uma fatura e inserida, atualizada ou deletada

CREATE OR REPLACE FUNCTION recalculate_invoice_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
  v_new_total  NUMERIC(15,2);
BEGIN
  -- Recalcula fatura antiga se mudou de fatura
  IF TG_OP = 'UPDATE' AND OLD.invoice_id IS DISTINCT FROM NEW.invoice_id THEN
    IF OLD.invoice_id IS NOT NULL THEN
      SELECT COALESCE(SUM(amount), 0)
      INTO v_new_total
      FROM transactions
      WHERE invoice_id = OLD.invoice_id
        AND deleted_at IS NULL
        AND status != 'cancelled';

      UPDATE credit_invoices
      SET total_amount = v_new_total,
          updated_at   = NOW()
      WHERE id = OLD.invoice_id;
    END IF;
  END IF;

  -- Determina invoice_id afetado
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;

  -- Recalcula total da fatura afetada
  IF v_invoice_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0)
    INTO v_new_total
    FROM transactions
    WHERE invoice_id = v_invoice_id
      AND deleted_at IS NULL
      AND status    != 'cancelled';

    UPDATE credit_invoices
    SET total_amount = v_new_total,
        updated_at   = NOW()
    WHERE id = v_invoice_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Remove trigger antigo se existir
DROP TRIGGER IF EXISTS trg_recalculate_invoice_total ON transactions;

-- Cria trigger
CREATE TRIGGER trg_recalculate_invoice_total
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION recalculate_invoice_total();


-- ── 3. Recalcula todos os saldos e totais existentes ─────────────────────────
-- Corrige dados que possam estar inconsistentes antes dos triggers

-- Recalcula saldos de contas nao-cartao
UPDATE accounts a
SET balance = (
  SELECT COALESCE(SUM(
    CASE
      WHEN t.type = 'income'  THEN  t.amount
      WHEN t.type = 'expense' THEN -t.amount
      ELSE 0
    END
  ), 0)
  FROM transactions t
  WHERE t.account_id = a.id
    AND t.deleted_at IS NULL
    AND t.status     = 'confirmed'
)
WHERE a.type != 'credit'
  AND a.deleted_at IS NULL;

-- Recalcula totais de faturas
UPDATE credit_invoices ci
SET total_amount = (
  SELECT COALESCE(SUM(t.amount), 0)
  FROM transactions t
  WHERE t.invoice_id = ci.id
    AND t.deleted_at IS NULL
    AND t.status    != 'cancelled'
);

-- Confirma resultado
SELECT
  'accounts'        AS tabela,
  COUNT(*)          AS registros,
  SUM(balance)      AS total_saldo
FROM accounts
WHERE deleted_at IS NULL
  AND type != 'credit'

UNION ALL

SELECT
  'credit_invoices' AS tabela,
  COUNT(*)          AS registros,
  SUM(total_amount) AS total_saldo
FROM credit_invoices;