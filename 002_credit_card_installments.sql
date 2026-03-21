# ============================================================
# aplicar-bloco2.ps1
# Salve em: E:\MyProjects\tofinanceapp\
# Execute:  .\aplicar-bloco2.ps1
# ============================================================

$destino = "E:\MyProjects\tofinanceapp"

if (-not (Test-Path $destino)) {
    Write-Host "ERRO: Pasta do projeto nao encontrada: $destino" -ForegroundColor Red
    exit 1
}

$ok    = 0
$erros = 0

function Escrever {
    param([string]$caminho, [string]$conteudo)
    $path = Join-Path $destino $caminho
    $pasta = Split-Path $path
    if (-not (Test-Path $pasta)) {
        New-Item -ItemType Directory -Path $pasta -Force | Out-Null
        Write-Host "  pasta criada: $pasta" -ForegroundColor DarkGray
    }
    if (Test-Path $path) {
        Copy-Item $path "$path.bak" -Force
        Write-Host "  bak   $caminho" -ForegroundColor DarkGray
    }
    [System.IO.File]::WriteAllText($path, $conteudo, [System.Text.Encoding]::UTF8)
    Write-Host "  ok    $caminho" -ForegroundColor Green
    $script:ok++
}

Write-Host ""
Write-Host "==> Aplicando Bloco 2: Cartao de credito e parcelamento" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# [1] MIGRATION SQL
# Execute este arquivo no SQL Editor do Supabase
# ============================================================

Write-Host "[1/7] Migration SQL" -ForegroundColor Yellow

$migration = @'
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
'@

Escrever "supabase\migrations\002_credit_card_installments.sql" $migration

# ============================================================
# [2] TIPOS TypeScript
# ============================================================

Write-Host "[2/7] Tipos TypeScript" -ForegroundColor Yellow

$types = @'
// types/index.ts
// Adicione estes tipos ao seu arquivo types/index.ts existente

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'wallet'

export interface Account {
  id:               string
  user_id:          string
  name:             string
  type:             AccountType
  balance:          number
  currency:         string
  color:            string | null
  icon:             string | null
  is_active:        boolean
  deleted_at:       string | null
  created_at:       string
  updated_at:       string
  // Campos de cartao de credito
  credit_limit:     number | null
  closing_day:      number | null
  due_day:          number | null
}

export type InvoiceStatus = 'open' | 'closed' | 'paid'

export interface CreditInvoice {
  id:               string
  account_id:       string
  user_id:          string
  reference_month:  string   // "2026-03"
  status:           InvoiceStatus
  due_date:         string
  total_amount:     number
  closed_at:        string | null
  paid_at:          string | null
  created_at:       string
  updated_at:       string
}

export interface InstallmentGroup {
  id:                string
  user_id:           string
  account_id:        string
  description:       string
  total_amount:      number
  installment_count: number
  created_at:        string
}

export interface Transaction {
  id:                   string
  user_id:              string
  account_id:           string
  category_id:          string | null
  invoice_id:           string | null
  installment_group_id: string | null
  installment_number:   number | null
  type:                 'income' | 'expense' | 'transfer'
  amount:               number
  description:          string
  notes:                string | null
  date:                 string
  status:               'confirmed' | 'pending' | 'cancelled'
  deleted_at:           string | null
  created_at:           string
  updated_at:           string
}

export interface Category {
  id:         string
  user_id:    string | null
  name:       string
  type:       'income' | 'expense'
  color:      string | null
  icon:       string | null
  is_active:  boolean
  deleted_at: string | null
}

export interface ApiResponse<T> {
  data:  T | null
  error: string | null
}
'@

Escrever "types\index.ts" $types

# ============================================================
# [3] SCHEMAS DE VALIDACAO
# ============================================================

Write-Host "[3/7] Schemas de validacao" -ForegroundColor Yellow

$schemas = @'
// lib/validations/schemas.ts
import { z } from 'zod'

const safeString = (max: number) =>
  z.string()
    .max(max)
    .trim()
    .refine(val => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(val), {
      message: 'Caracteres invalidos detectados',
    })

const hexColor = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor invalida - use formato #RRGGBB')
  .optional()

const isoDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida - use formato YYYY-MM-DD')
  .refine(val => !isNaN(new Date(val).getTime()), 'Data invalida')
  .refine(val => {
    const year = parseInt(val.split('-')[0])
    return year >= 2000 && year <= 2100
  }, 'Data fora do intervalo permitido')

// ── Account ───────────────────────────────────────────────────────────────────

export const createAccountSchema = z.object({
  name:            safeString(100).min(1, 'Nome e obrigatorio'),
  type:            z.enum(['checking', 'savings', 'credit', 'investment', 'wallet']),
  currency:        z.string().length(3).regex(/^[A-Z]{3}$/).default('BRL'),
  color:           hexColor,
  icon:            safeString(50).optional(),
  initial_balance: z.number().min(0).max(999999999).optional(),
  // Campos de cartao (obrigatorios se type === 'credit')
  credit_limit:    z.number().positive().max(999999999).optional(),
  closing_day:     z.number().int().min(1).max(31).optional(),
  due_day:         z.number().int().min(1).max(31).optional(),
}).refine(data => {
  if (data.type === 'credit') {
    return data.credit_limit != null && data.closing_day != null && data.due_day != null
  }
  return true
}, {
  message: 'Cartao de credito requer limite, dia de fechamento e dia de vencimento',
  path: ['credit_limit'],
})

export const updateAccountSchema = z.object({
  name:          safeString(100).min(1).optional(),
  type:          z.enum(['checking', 'savings', 'credit', 'investment', 'wallet']).optional(),
  color:         hexColor,
  icon:          safeString(50).optional(),
  is_active:     z.boolean().optional(),
  credit_limit:  z.number().positive().max(999999999).optional(),
  closing_day:   z.number().int().min(1).max(31).optional(),
  due_day:       z.number().int().min(1).max(31).optional(),
})

// ── Category ──────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name:  safeString(100).min(1, 'Nome e obrigatorio'),
  type:  z.enum(['income', 'expense']),
  color: hexColor,
  icon:  safeString(50).optional(),
})

export const updateCategorySchema = z.object({
  name:      safeString(100).min(1).optional(),
  color:     hexColor,
  icon:      safeString(50).optional(),
  is_active: z.boolean().optional(),
})

// ── Transaction ───────────────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  account_id:        z.string().uuid('Conta invalida'),
  category_id:       z.string().uuid('Categoria invalida').optional(),
  invoice_id:        z.string().uuid().optional(),
  type:              z.enum(['income', 'expense', 'transfer']),
  amount:            z.number()
                       .positive('Valor deve ser maior que zero')
                       .max(999999999.99)
                       .refine(val => Math.round(val * 100) / 100 === val, {
                         message: 'Valor com mais de 2 casas decimais',
                       }),
  description:       safeString(255).min(1, 'Descricao e obrigatoria'),
  notes:             safeString(1000).optional(),
  date:              isoDate,
  status:            z.enum(['confirmed', 'pending', 'cancelled']).default('confirmed'),
  // Parcelamento
  installments:      z.number().int().min(1).max(48).default(1),
})

// ── Invoice ───────────────────────────────────────────────────────────────────

export const payInvoiceSchema = z.object({
  payment_account_id: z.string().uuid('Conta de pagamento invalida'),
  amount:             z.number().positive('Valor deve ser maior que zero'),
  payment_date:       isoDate,
})

// ── Tipos exportados ──────────────────────────────────────────────────────────

export type CreateAccountInput     = z.infer<typeof createAccountSchema>
export type UpdateAccountInput     = z.infer<typeof updateAccountSchema>
export type CreateCategoryInput    = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput    = z.infer<typeof updateCategorySchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type PayInvoiceInput        = z.infer<typeof payInvoiceSchema>
'@

Escrever "lib\validations\schemas.ts" $schemas

# ============================================================
# [4] LOGICA DE FATURAS (domain)
# ============================================================

Write-Host "[4/7] Logica de faturas" -ForegroundColor Yellow

$invoiceLogic = @'
// lib/domain/invoices.ts
// Logica de negocio de faturas - sem dependencia de framework

import type { Account, CreditInvoice } from '@/types'

/**
 * Calcula o mes de referencia de uma fatura dado uma data de compra.
 * Se a compra ocorre APOS o fechamento, vai para a proxima fatura.
 *
 * Exemplo: closing_day = 25
 *   compra em 20/03 → fatura "2026-03"
 *   compra em 26/03 → fatura "2026-04"
 */
export function getReferenceMonth(purchaseDate: Date, closingDay: number): string {
  const day   = purchaseDate.getDate()
  const month = purchaseDate.getMonth()  // 0-indexed
  const year  = purchaseDate.getFullYear()

  if (day <= closingDay) {
    // Compra dentro do ciclo atual
    return `${year}-${String(month + 1).padStart(2, '0')}`
  } else {
    // Compra apos fechamento - vai para o proximo ciclo
    const next = new Date(year, month + 1, 1)
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
  }
}

/**
 * Calcula a data de vencimento de uma fatura.
 * Se due_day < closing_day, o vencimento e no mes seguinte ao fechamento.
 */
export function getDueDate(referenceMonth: string, closingDay: number, dueDay: number): string {
  const [year, month] = referenceMonth.split('-').map(Number)

  // Vencimento e sempre apos o fechamento
  // Se due_day <= closing_day, vence no mes seguinte
  if (dueDay <= closingDay) {
    const next = new Date(year, month, 1) // month ja e 1-indexed, new Date(y, m, 1) = proximo mes
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
  } else {
    return `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
  }
}

/**
 * Verifica se uma fatura deveria ter fechado (fechamento automatico).
 * Retorna true se a data atual e posterior ao dia de fechamento
 * do mes de referencia da fatura.
 */
export function shouldAutoClose(invoice: CreditInvoice, closingDay: number): boolean {
  if (invoice.status !== 'open') return false

  const [year, month] = invoice.reference_month.split('-').map(Number)
  const closingDate   = new Date(year, month - 1, closingDay)
  const today         = new Date()

  // Compara apenas a data, sem hora
  today.setHours(0, 0, 0, 0)
  closingDate.setHours(0, 0, 0, 0)

  return today > closingDate
}

/**
 * Calcula o limite disponivel de um cartao.
 * limite_disponivel = credit_limit - soma das faturas abertas e fechadas (nao pagas)
 */
export function getAvailableLimit(account: Account, openInvoicesTotal: number): number {
  if (!account.credit_limit) return 0
  return account.credit_limit - openInvoicesTotal
}

/**
 * Gera as datas de cada parcela a partir da data da compra.
 * Cada parcela vai para a fatura do mes correspondente.
 */
export function getInstallmentDates(
  purchaseDate: Date,
  installmentCount: number,
  closingDay: number
): Array<{ referenceMonth: string; date: string }> {
  const result = []
  const baseDate = new Date(purchaseDate)

  for (let i = 0; i < installmentCount; i++) {
    const refMonth = getReferenceMonth(baseDate, closingDay)
    result.push({
      referenceMonth: refMonth,
      date: baseDate.toISOString().split('T')[0],
    })
    // Proxima parcela = mesmo dia, mes seguinte
    baseDate.setMonth(baseDate.getMonth() + 1)
  }

  return result
}
'@

Escrever "lib\domain\invoices.ts" $invoiceLogic

# ============================================================
# [5] API DE FATURAS
# ============================================================

Write-Host "[5/7] APIs" -ForegroundColor Yellow

$invoicesRoute = @'
// app/api/invoices/route.ts
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, CreditInvoice } from '@/types'
import { NextResponse } from 'next/server'
import { shouldAutoClose } from '@/lib/domain/invoices'

// GET /api/invoices?account_id=xxx
export async function GET(request: Request): Promise<NextResponse<ApiResponse<CreditInvoice[]>>> {
  try {
    const supabase  = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id')

    if (!accountId) {
      return NextResponse.json({ data: null, error: 'account_id e obrigatorio' }, { status: 400 })
    }

    // Busca a conta para obter closing_day
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, closing_day, due_day, type')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ data: null, error: 'Conta nao encontrada' }, { status: 404 })
    }

    if (account.type !== 'credit') {
      return NextResponse.json({ data: null, error: 'Conta nao e um cartao de credito' }, { status: 400 })
    }

    // Busca faturas
    const { data: invoices, error } = await supabase
      .from('credit_invoices')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .order('reference_month', { ascending: false })

    if (error) throw error

    // Fechamento automatico: fecha faturas que passaram do dia de fechamento
    if (account.closing_day && invoices) {
      const toClose = invoices.filter(inv => shouldAutoClose(inv, account.closing_day!))

      for (const invoice of toClose) {
        await supabase
          .from('credit_invoices')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .eq('id', invoice.id)

        invoice.status    = 'closed'
        invoice.closed_at = new Date().toISOString()
      }
    }

    return NextResponse.json({ data: invoices, error: null })
  } catch (err) {
    console.error('[GET /api/invoices]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
'@

Escrever "app\api\invoices\route.ts" $invoicesRoute

$invoiceIdRoute = @'
// app/api/invoices/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { payInvoiceSchema } from '@/lib/validations/schemas'
import type { ApiResponse, CreditInvoice } from '@/types'
import { NextResponse } from 'next/server'

// POST /api/invoices/[id]/pay  →  pagar fatura
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<CreditInvoice>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const body   = await request.json()
    const parsed = payInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues[0]?.message ?? 'Dados invalidos' }, { status: 400 })
    }

    // Busca a fatura
    const { data: invoice, error: findError } = await supabase
      .from('credit_invoices')
      .select('*, accounts(id, name)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (findError || !invoice) {
      return NextResponse.json({ data: null, error: 'Fatura nao encontrada' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ data: null, error: 'Fatura ja foi paga' }, { status: 409 })
    }

    if (invoice.status === 'open') {
      return NextResponse.json({ data: null, error: 'Fatura ainda esta aberta - feche antes de pagar' }, { status: 409 })
    }

    // Cria transacao de pagamento na conta de origem
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id:     user.id,
        account_id:  parsed.data.payment_account_id,
        type:        'expense',
        amount:      parsed.data.amount,
        description: `Pagamento fatura ${invoice.reference_month}`,
        date:        parsed.data.payment_date,
        status:      'confirmed',
        invoice_id:  invoice.id,
      })

    if (txError) throw txError

    // Marca fatura como paga
    const { data: updated, error: updateError } = await supabase
      .from('credit_invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ data: updated, error: null })
  } catch (err) {
    console.error('[POST /api/invoices/:id/pay]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
'@

Escrever "app\api\invoices\[id]\route.ts" $invoiceIdRoute

# API de transacoes atualizada com suporte a parcelamento
$transactionsRoute = @'
// app/api/transactions/route.ts
import { createClient } from '@/lib/supabase/server'
import { createTransactionSchema } from '@/lib/validations/schemas'
import { getReferenceMonth, getDueDate, getInstallmentDates } from '@/lib/domain/invoices'
import type { ApiResponse, Transaction } from '@/types'
import { NextResponse } from 'next/server'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Transaction[]>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id')
    const invoiceId = searchParams.get('invoice_id')
    const limit     = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
    const offset    = parseInt(searchParams.get('offset') ?? '0')

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (accountId) query = query.eq('account_id', accountId)
    if (invoiceId) query = query.eq('invoice_id', invoiceId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[GET /api/transactions]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Transaction | Transaction[]>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const body   = await request.json()
    const parsed = createTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues[0]?.message ?? 'Dados invalidos' }, { status: 400 })
    }

    const { installments, ...txData } = parsed.data

    // Busca a conta para verificar se e cartao
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, type, closing_day, due_day, credit_limit')
      .eq('id', txData.account_id)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ data: null, error: 'Conta nao encontrada' }, { status: 404 })
    }

    const isCreditCard = account.type === 'credit'

    // ── Transacao simples (sem parcelamento) ──────────────────────────────────
    if (installments === 1) {
      let invoiceId: string | null = null

      if (isCreditCard && account.closing_day && account.due_day) {
        const purchaseDate   = new Date(txData.date + 'T12:00:00')
        const referenceMonth = getReferenceMonth(purchaseDate, account.closing_day)
        const dueDate        = getDueDate(referenceMonth, account.closing_day, account.due_day)

        // Busca ou cria a fatura do mes
        const { data: existing } = await supabase
          .from('credit_invoices')
          .select('id')
          .eq('account_id', account.id)
          .eq('reference_month', referenceMonth)
          .single()

        if (existing) {
          invoiceId = existing.id
        } else {
          const { data: newInvoice, error: invoiceError } = await supabase
            .from('credit_invoices')
            .insert({
              account_id:      account.id,
              user_id:         user.id,
              reference_month: referenceMonth,
              due_date:        dueDate,
              status:          'open',
              total_amount:    0,
            })
            .select('id')
            .single()

          if (invoiceError) throw invoiceError
          invoiceId = newInvoice.id
        }

        // Atualiza total da fatura
        await supabase.rpc('increment_invoice_total', {
          p_invoice_id: invoiceId,
          p_amount:     txData.amount,
        }).maybeSingle()
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...txData, user_id: user.id, invoice_id: invoiceId })
        .select()
        .single()

      if (error) throw error

      // Atualiza saldo da conta (somente para nao-cartao)
      if (!isCreditCard) {
        const delta = txData.type === 'income' ? txData.amount : -txData.amount
        await supabase
          .from('accounts')
          .update({ balance: supabase.rpc('accounts_balance_increment', { p_id: account.id, p_delta: delta }) })
          .eq('id', account.id)
      }

      return NextResponse.json({ data, error: null }, { status: 201 })
    }

    // ── Transacao parcelada ───────────────────────────────────────────────────
    if (!isCreditCard) {
      return NextResponse.json(
        { data: null, error: 'Parcelamento disponivel apenas para cartao de credito' },
        { status: 400 }
      )
    }

    if (!account.closing_day || !account.due_day) {
      return NextResponse.json(
        { data: null, error: 'Cartao sem dia de fechamento ou vencimento configurado' },
        { status: 400 }
      )
    }

    const installmentAmount = Math.round((txData.amount / installments) * 100) / 100
    const purchaseDate      = new Date(txData.date + 'T12:00:00')
    const installmentDates  = getInstallmentDates(purchaseDate, installments, account.closing_day)

    // Cria o grupo de parcelamento
    const { data: group, error: groupError } = await supabase
      .from('installment_groups')
      .insert({
        user_id:           user.id,
        account_id:        account.id,
        description:       txData.description,
        total_amount:      txData.amount,
        installment_count: installments,
      })
      .select('id')
      .single()

    if (groupError) throw groupError

    // Cria uma transacao por parcela
    const transactions = []
    for (let i = 0; i < installments; i++) {
      const { referenceMonth, date } = installmentDates[i]
      const dueDate = getDueDate(referenceMonth, account.closing_day, account.due_day)

      // Busca ou cria fatura do mes
      let invoiceId: string

      const { data: existing } = await supabase
        .from('credit_invoices')
        .select('id')
        .eq('account_id', account.id)
        .eq('reference_month', referenceMonth)
        .single()

      if (existing) {
        invoiceId = existing.id
      } else {
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('credit_invoices')
          .insert({
            account_id:      account.id,
            user_id:         user.id,
            reference_month: referenceMonth,
            due_date:        dueDate,
            status:          'open',
            total_amount:    0,
          })
          .select('id')
          .single()

        if (invoiceError) throw invoiceError
        invoiceId = newInvoice!.id
      }

      transactions.push({
        user_id:              user.id,
        account_id:           account.id,
        category_id:          txData.category_id ?? null,
        invoice_id:           invoiceId,
        installment_group_id: group.id,
        installment_number:   i + 1,
        type:                 'expense' as const,
        amount:               installmentAmount,
        description:          `${txData.description} (${i + 1}/${installments})`,
        notes:                txData.notes ?? null,
        date:                 date,
        status:               'confirmed' as const,
      })
    }

    const { data: created, error: insertError } = await supabase
      .from('transactions')
      .insert(transactions)
      .select()

    if (insertError) throw insertError

    return NextResponse.json({ data: created, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/transactions]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
'@

Escrever "app\api\transactions\route.ts" $transactionsRoute

# ============================================================
# [6] FORMULARIO DE CONTA ATUALIZADO
# ============================================================

Write-Host "[6/7] Componentes" -ForegroundColor Yellow

$accountForm = @'
// components/finance/AccountForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/useAccounts'
import type { Account } from '@/types'

const COLOR_PRESETS = [
  '#6ee7b7', '#34d399', '#60a5fa', '#818cf8',
  '#f472b6', '#fb923c', '#fbbf24', '#a78bfa',
  '#94a3b8', '#f87171',
]

const ACCOUNT_TYPES = [
  { value: 'checking',   label: 'Conta corrente'    },
  { value: 'savings',    label: 'Poupanca'           },
  { value: 'credit',     label: 'Cartao de credito'  },
  { value: 'investment', label: 'Investimento'       },
  { value: 'wallet',     label: 'Carteira'           },
]

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

interface AccountFormProps {
  account?: Account
  onSuccess: () => void
}

export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const isEditing = !!account
  const router    = useRouter()

  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()

  const [form, setForm] = useState({
    name:            account?.name             ?? '',
    type:            account?.type             ?? 'checking',
    color:           account?.color            ?? '#6ee7b7',
    initial_balance: '',
    credit_limit:    account?.credit_limit?.toString()  ?? '',
    closing_day:     account?.closing_day?.toString()   ?? '25',
    due_day:         account?.due_day?.toString()        ?? '5',
  })

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError]                 = useState('')

  const isCreditCard = form.type === 'credit'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const base: Record<string, unknown> = {
      name:  form.name,
      type:  form.type,
      color: form.color,
    }

    if (isCreditCard) {
      if (!form.credit_limit || !form.closing_day || !form.due_day) {
        setError('Preencha limite, dia de fechamento e vencimento.')
        return
      }
      base.credit_limit = parseFloat(form.credit_limit)
      base.closing_day  = parseInt(form.closing_day)
      base.due_day      = parseInt(form.due_day)
    }

    if (isEditing) {
      updateAccount.mutate(
        { id: account.id, body: base },
        {
          onSuccess: () => { onSuccess(); router.refresh() },
          onError:   (err) => setError(err.message),
        }
      )
    } else {
      const initialValue = parseFloat(form.initial_balance)
      if (!isNaN(initialValue) && initialValue > 0) {
        base.initial_balance = initialValue
      }
      createAccount.mutate(base, {
        onSuccess: () => { onSuccess(); router.refresh() },
        onError:   (err) => setError(err.message),
      })
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteAccount.mutate(account!.id, {
      onSuccess: () => { onSuccess(); router.refresh() },
      onError:   (err) => setError(err.message),
    })
  }

  const isPending = createAccount.isPending || updateAccount.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Nome */}
      <div>
        <label className="label">Nome da conta</label>
        <input
          type="text"
          className="input"
          placeholder="Ex: Nubank, Itau, Carteira..."
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
      </div>

      {/* Tipo */}
      <div>
        <label className="label">Tipo</label>
        <select
          className="input"
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
        >
          {ACCOUNT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Campos especificos de cartao */}
      {isCreditCard && (
        <div className="space-y-3 p-3 rounded-xl"
          style={{ background: 'rgba(129,140,248,0.06)', border: '0.5px solid rgba(129,140,248,0.2)' }}>

          <p className="text-xs font-medium" style={{ color: '#818cf8' }}>
            Configuracoes do cartao
          </p>

          {/* Limite */}
          <div>
            <label className="label">Limite total (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="Ex: 5000,00"
              value={form.credit_limit}
              onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))}
              required={isCreditCard}
            />
          </div>

          {/* Dia de fechamento e vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dia de fechamento</label>
              <select
                className="input"
                value={form.closing_day}
                onChange={e => setForm(f => ({ ...f, closing_day: e.target.value }))}
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Dia de vencimento</label>
              <select
                className="input"
                value={form.due_day}
                onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))}
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Saldo inicial - somente criacao e nao-cartao */}
      {!isEditing && !isCreditCard && (
        <div>
          <label className="label">Saldo inicial (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            placeholder="0,00 - deixe vazio se nao souber"
            value={form.initial_balance}
            onChange={e => setForm(f => ({ ...f, initial_balance: e.target.value }))}
          />
          <p className="mt-1 text-[11px]" style={{ color: 'rgba(200,198,190,0.35)' }}>
            Sera registrado como uma transacao de receita inicial.
          </p>
        </div>
      )}

      {/* Cor */}
      <div>
        <label className="label">Cor</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {COLOR_PRESETS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setForm(f => ({ ...f, color }))}
              className="w-7 h-7 rounded-full transition-all duration-150"
              style={{
                background:    color,
                outline:       form.color === color ? `2px solid ${color}` : 'none',
                outlineOffset: '2px',
                opacity:       form.color === color ? 1 : 0.5,
              }}
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full justify-center py-2.5"
        disabled={isPending}
      >
        {isPending ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Criar conta'}
      </button>

      {isEditing && (
        <>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteAccount.isPending}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              confirmDelete
                ? 'bg-red-500 text-white'
                : 'bg-transparent text-red-400 border border-red-500/30'
            }`}
          >
            {deleteAccount.isPending ? 'Excluindo...' : confirmDelete ? 'Confirmar exclusao' : 'Excluir conta'}
          </button>
          {confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="w-full py-2 text-xs"
              style={{ color: 'rgba(200,198,190,0.35)' }}
            >
              Cancelar exclusao
            </button>
          )}
        </>
      )}
    </form>
  )
}
'@

Escrever "components\finance\AccountForm.tsx" $accountForm

# Hook de faturas
$useInvoices = @'
// hooks/useInvoices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreditInvoice, ApiResponse } from '@/types'

export function useInvoices(accountId: string | null) {
  return useQuery({
    queryKey: ['invoices', accountId],
    enabled:  !!accountId,
    queryFn:  async (): Promise<CreditInvoice[]> => {
      const res  = await fetch(`/api/invoices?account_id=${accountId}`)
      const json: ApiResponse<CreditInvoice[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })
}

export function usePayInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      invoiceId,
      body,
    }: {
      invoiceId: string
      body: Record<string, unknown>
    }) => {
      const res  = await fetch(`/api/invoices/${invoiceId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json: ApiResponse<CreditInvoice> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
'@

Escrever "hooks\useInvoices.ts" $useInvoices

# ============================================================
# [7] PAGINA DE FATURA
# ============================================================

Write-Host "[7/7] Pagina de fatura" -ForegroundColor Yellow

$invoicePage = @'
// app/(dashboard)/fatura/[id]/page.tsx
'use client'

import { useParams, useRouter }    from 'next/navigation'
import { useState }                from 'react'
import { useInvoices, usePayInvoice } from '@/hooks/useInvoices'
import { useAccounts }             from '@/hooks/useAccounts'
import { useQuery }                from '@tanstack/react-query'
import { formatCurrency }          from '@/lib/utils/format'
import type { Transaction, ApiResponse } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  open:   'Aberta',
  closed: 'Fechada',
  paid:   'Paga',
}

const STATUS_COLOR: Record<string, string> = {
  open:   '#fbbf24',
  closed: '#fb923c',
  paid:   '#6ee7b7',
}

export default function FaturaPage() {
  const { id: accountId } = useParams<{ id: string }>()
  const router            = useRouter()

  const { data: accounts = [] } = useAccounts()
  const { data: invoices = [], isLoading } = useInvoices(accountId)
  const payInvoice = usePayInvoice()

  const account = accounts.find(a => a.id === accountId)

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [paymentAccountId,  setPaymentAccountId]  = useState('')
  const [paymentDate,       setPaymentDate]        = useState(
    new Date().toISOString().split('T')[0]
  )
  const [error, setError] = useState('')

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId) ?? invoices[0] ?? null

  // Transacoes da fatura selecionada
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', 'invoice', selectedInvoice?.id],
    enabled:  !!selectedInvoice?.id,
    queryFn:  async (): Promise<Transaction[]> => {
      const res  = await fetch(`/api/transactions?invoice_id=${selectedInvoice!.id}`)
      const json: ApiResponse<Transaction[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })

  const payableAccounts = accounts.filter(a => a.type !== 'credit' && a.is_active)

  async function handlePay() {
    if (!selectedInvoice || !paymentAccountId) return
    setError('')

    payInvoice.mutate(
      {
        invoiceId: selectedInvoice.id,
        body: {
          payment_account_id: paymentAccountId,
          amount:             selectedInvoice.total_amount,
          payment_date:       paymentDate,
        },
      },
      {
        onSuccess: () => setSelectedInvoiceId(null),
        onError:   (err) => setError(err.message),
      }
    )
  }

  if (!account) return null

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="text-xs px-2 py-1 rounded-lg transition-colors"
          style={{ color: 'rgba(200,198,190,0.5)', background: 'rgba(255,255,255,0.04)' }}
        >
          ← voltar
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">
            {account.name}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(200,198,190,0.35)' }}>
            Fecha dia {account.closing_day} · Vence dia {account.due_day}
          </p>
        </div>
      </div>

      {/* Limite */}
      {account.credit_limit && (
        <div className="card mb-6 grid grid-cols-3 gap-4">
          <div>
            <p className="label">Limite total</p>
            <p className="text-lg font-semibold text-[#f0ede8]">
              {formatCurrency(account.credit_limit)}
            </p>
          </div>
          <div>
            <p className="label">Fatura aberta</p>
            <p className="text-lg font-semibold text-[#fbbf24]">
              {formatCurrency(invoices.find(i => i.status === 'open')?.total_amount ?? 0)}
            </p>
          </div>
          <div>
            <p className="label">Disponivel</p>
            <p className="text-lg font-semibold text-[#6ee7b7]">
              {formatCurrency(
                account.credit_limit -
                invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.total_amount), 0)
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Lista de faturas */}
        <div>
          <p className="section-heading">Faturas</p>
          {isLoading ? (
            <div className="space-y-1">
              {[1,2,3].map(i => (
                <div key={i} className="db-row px-2 py-3 animate-pulse">
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: 'rgba(200,198,190,0.35)' }}>
              Nenhuma fatura ainda
            </p>
          ) : (
            <div className="space-y-0.5">
              {invoices.map(invoice => (
                <div
                  key={invoice.id}
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                  className={`db-row flex items-center justify-between px-2 py-3 ${
                    (selectedInvoice?.id ?? invoices[0]?.id) === invoice.id
                      ? 'bg-white/5'
                      : ''
                  }`}
                >
                  <div>
                    <p className="text-sm text-[#e8e6e1]">{invoice.reference_month}</p>
                    <p className="text-[10px]" style={{ color: STATUS_COLOR[invoice.status] }}>
                      {STATUS_LABEL[invoice.status]}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#f0ede8]">
                    {formatCurrency(Number(invoice.total_amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detalhe da fatura selecionada */}
        <div className="md:col-span-2">
          {selectedInvoice ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="section-heading mb-0">
                  Lancamentos · {selectedInvoice.reference_month}
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    color:       STATUS_COLOR[selectedInvoice.status],
                    background:  `${STATUS_COLOR[selectedInvoice.status]}18`,
                  }}>
                  {STATUS_LABEL[selectedInvoice.status]}
                </span>
              </div>

              {/* Transacoes */}
              <div className="space-y-0.5 mb-4">
                {transactions.length === 0 ? (
                  <p className="text-xs py-6 text-center" style={{ color: 'rgba(200,198,190,0.35)' }}>
                    Nenhum lancamento nesta fatura
                  </p>
                ) : (
                  transactions.map(tx => (
                    <div key={tx.id} className="db-row flex items-center justify-between px-2 py-2.5">
                      <div>
                        <p className="text-sm text-[#e8e6e1]">{tx.description}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(200,198,190,0.35)' }}>
                          {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          {tx.installment_number && tx.installment_group_id &&
                            ` · Parcela ${tx.installment_number}`}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-[#fca5a5]">
                        -{formatCurrency(Number(tx.amount))}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between px-2 py-2 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-sm text-[#e8e6e1]">Total da fatura</p>
                <p className="text-sm font-semibold text-[#f0ede8]">
                  {formatCurrency(Number(selectedInvoice.total_amount))}
                </p>
              </div>

              {/* Pagar fatura */}
              {selectedInvoice.status === 'closed' && (
                <div className="mt-4 p-4 rounded-xl space-y-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-medium text-[#e8e6e1]">Pagar fatura</p>

                  <div>
                    <label className="label">Pagar com</label>
                    <select
                      className="input"
                      value={paymentAccountId}
                      onChange={e => setPaymentAccountId(e.target.value)}
                    >
                      <option value="">Selecione uma conta...</option>
                      {payableAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Data do pagamento</label>
                    <input
                      type="date"
                      className="input"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                    />
                  </div>

                  {error && (
                    <p className="text-xs px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handlePay}
                    disabled={!paymentAccountId || payInvoice.isPending}
                    className="btn-primary w-full justify-center py-2.5"
                  >
                    {payInvoice.isPending
                      ? 'Processando...'
                      : `Pagar ${formatCurrency(Number(selectedInvoice.total_amount))}`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs py-16 text-center" style={{ color: 'rgba(200,198,190,0.35)' }}>
              Selecione uma fatura
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
'@

Escrever "app\(dashboard)\fatura\[id]\page.tsx" $invoicePage

# ============================================================
# RESULTADO
# ============================================================

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor DarkGray

if ($erros -gt 0) {
    Write-Host "$ok copiado(s)  |  $erros com erro" -ForegroundColor Yellow
} else {
    Write-Host "$ok arquivo(s) criado(s) com sucesso." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor White
    Write-Host ""
    Write-Host "  1. Execute no Supabase SQL Editor:" -ForegroundColor Gray
    Write-Host "     $destino\supabase\migrations\002_credit_card_installments.sql" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  2. Inicie o servidor:" -ForegroundColor Gray
    Write-Host "     npm run dev" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  3. Crie um cartao em /contas e teste:" -ForegroundColor Gray
    Write-Host "     http://localhost:3000/contas" -ForegroundColor DarkGray
    Write-Host "     http://localhost:3000/fatura/[id-do-cartao]" -ForegroundColor DarkGray
}
Write-Host ""