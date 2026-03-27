// app/api/transactions/route.ts
// Com os triggers no banco, nao precisamos mais atualizar
// saldo e total de fatura manualmente — o banco faz isso atomicamente.

import { createClient }                                        from '@/lib/supabase/server'
import { fail, logInternalError }                              from '@/lib/apiResponse'
import { createTransactionSchema }                             from '@/lib/validations/schemas'
import { getReferenceMonth, getDueDate, getInstallmentDates } from '@/lib/domain/invoices'
import { ratelimit }                                           from '@/lib/rateLimit'
import { finalizeIdempotency, prepareIdempotency }             from '@/lib/idempotency'
import { headers }                                             from 'next/headers'
import type { ApiResponse, Transaction }                       from '@/types'
import { NextResponse }                                        from 'next/server'

async function getIP(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

// ── GET /api/transactions ─────────────────────────────────────────────────────

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Transaction[]>>> {
  try {
    const { success: allowed } = await ratelimit.limit(await getIP())
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Muitas requisicoes. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId    = searchParams.get('account_id')
    const invoiceId    = searchParams.get('invoice_id')
    const start        = searchParams.get('start')
    const end          = searchParams.get('end')
    const limit        = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)
    const offset       = parseInt(searchParams.get('offset') ?? '0')
    // Suporte a visão do parceiro — RLS valida se o acesso é permitido
    const targetUserId = searchParams.get('user_id') ?? user.id

    let query = supabase
      .from('transactions')
      .select(`
        *,
        account:accounts!transactions_account_id_fkey(id, name, color, icon),
        category:categories(id, name, color, icon)
      `)
      .eq('user_id', targetUserId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (accountId) query = query.eq('account_id', accountId)
    if (invoiceId) query = query.eq('invoice_id', invoiceId)
    if (start)     query = query.gte('date', start)
    if (end)       query = query.lte('date', end)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[GET /api/transactions]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

// ── Helpers de fatura ─────────────────────────────────────────────────────────

async function getOrCreateInvoice(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId:      string,
  userId:         string,
  referenceMonth: string,
  dueDate:        string
): Promise<string> {
  const { data: existing } = await supabase
    .from('credit_invoices')
    .select('id')
    .eq('account_id', accountId)
    .eq('reference_month', referenceMonth)
    .single()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('credit_invoices')
    .insert({
      account_id:      accountId,
      user_id:         userId,
      reference_month: referenceMonth,
      due_date:        dueDate,
      status:          'open',
      total_amount:    0,
    })
    .select('id')
    .single()

  if (error) throw error
  return created.id
}

// ── POST /api/transactions ────────────────────────────────────────────────────

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<Transaction | Transaction[]>>> {
  try {
    const { success: allowed } = await ratelimit.limit(await getIP())
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Muitas requisicoes. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const body   = await request.json()
    const parsed = createTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'Dados invalidos')
    }

    const preparedIdempotency = await prepareIdempotency(request, {
      userId: user.id,
      scope: 'transactions:create',
      payload: parsed.data,
    })
    if (preparedIdempotency.conflictError) {
      return fail(409, 'Idempotency-Key invalida para esta operacao.')
    }
    if (preparedIdempotency.replay) {
      return NextResponse.json(
        preparedIdempotency.replay.body as ApiResponse<Transaction | Transaction[]>,
        { status: preparedIdempotency.replay.status }
      )
    }
    if (preparedIdempotency.inProgress) {
      return NextResponse.json(
        { data: null, error: 'Requisicao em processamento com a mesma Idempotency-Key.' },
        { status: 409 }
      )
    }

    const respond = async (
      status: number,
      payload: ApiResponse<Transaction | Transaction[]>
    ): Promise<NextResponse<ApiResponse<Transaction | Transaction[]>>> => {
      await finalizeIdempotency(preparedIdempotency, status, payload)
      return NextResponse.json(payload, { status })
    }

    const { installments, ...txData } = parsed.data

    // Busca conta
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, type, closing_day, due_day, credit_limit')
      .eq('id', txData.account_id)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return respond(404, { data: null, error: 'Conta nao encontrada' })
    }

    const isCreditCard = account.type === 'credit'

    // ── Transacao simples ─────────────────────────────────────────────────────
    if (installments === 1) {
      let invoiceId: string | null = null

      if (isCreditCard && account.closing_day && account.due_day) {
        const purchaseDate   = new Date(txData.date + 'T12:00:00')
        const referenceMonth = getReferenceMonth(purchaseDate, account.closing_day)
        const dueDate        = getDueDate(referenceMonth, account.closing_day, account.due_day)
        invoiceId = await getOrCreateInvoice(supabase, account.id, user.id, referenceMonth, dueDate)
      }

      // Insere transacao — o trigger cuida do saldo e do total da fatura
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...txData, user_id: user.id, invoice_id: invoiceId })
        .select(`
          *,
          account:accounts!transactions_account_id_fkey(id, name, color, icon),
          category:categories(id, name, color, icon)
        `)
        .single()

      if (error) throw error
      return respond(201, { data, error: null })
    }

    // ── Transacao parcelada ───────────────────────────────────────────────────
    if (!isCreditCard) {
      return respond(400, { data: null, error: 'Parcelamento disponivel apenas para cartao de credito' })
    }

    if (!account.closing_day || !account.due_day) {
      return respond(400, { data: null, error: 'Cartao sem dia de fechamento ou vencimento configurado' })
    }

    const baseAmount       = Math.floor((txData.amount / installments) * 100) / 100
    const remainder        = Math.round((txData.amount - baseAmount * installments) * 100)
    const purchaseDate     = new Date(txData.date + 'T12:00:00')
    const installmentDates = getInstallmentDates(purchaseDate, installments, account.closing_day)

    // Cria grupo de parcelamento
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

    // Monta todas as parcelas
    const toInsert = await Promise.all(
      installmentDates.map(async ({ referenceMonth, date }, i) => {
        const dueDate   = getDueDate(referenceMonth, account.closing_day!, account.due_day!)
        const invoiceId = await getOrCreateInvoice(supabase, account.id, user.id, referenceMonth, dueDate)
        const amount    = i === installments - 1 ? baseAmount + remainder / 100 : baseAmount

        return {
          user_id:              user.id,
          account_id:           account.id,
          category_id:          txData.category_id ?? null,
          invoice_id:           invoiceId,
          installment_group_id: group.id,
          installment_number:   i + 1,
          type:                 'expense' as const,
          amount,
          description:          `${txData.description} (${i + 1}/${installments})`,
          notes:                txData.notes ?? null,
          date,
          status:               'confirmed' as const,
        }
      })
    )

    // Insere todas — triggers cuidam do total de cada fatura
    const { data: created, error: insertError } = await supabase
      .from('transactions')
      .insert(toInsert)
      .select()

    if (insertError) throw insertError
    return respond(201, { data: created, error: null })
  } catch (err) {
    logInternalError('POST /api/transactions', err)
    return fail(500, 'Erro interno')
  }
}
