-- ============================================================
-- Migration 003: Funcao para atualizar total da fatura
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Funcao que incrementa o total de uma fatura de forma atomica
CREATE OR REPLACE FUNCTION increment_invoice_total(
  p_invoice_id UUID,
  p_amount     NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE credit_invoices
  SET
    total_amount = total_amount + p_amount,
    updated_at   = NOW()
  WHERE id = p_invoice_id;
END;
$$;

-- Recalcula o total de todas as faturas a partir das transacoes
-- (corrige faturas ja existentes com total errado)
UPDATE credit_invoices ci
SET total_amount = (
  SELECT COALESCE(SUM(t.amount), 0)
  FROM transactions t
  WHERE t.invoice_id  = ci.id
    AND t.deleted_at IS NULL
    AND t.status     != 'cancelled'
);