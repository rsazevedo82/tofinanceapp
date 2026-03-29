// app/api/transactions/[id]/route.ts
import { createClient }             from '@/lib/supabase/server'
import { createTransactionSchema }  from '@/lib/validations/schemas'
import { buildEqualSplitAmounts, shouldAutoSplitTransaction } from '@/lib/splitLogic'
import { checkRateLimitByIP, checkRateLimitByUser } from '@/lib/apiHelpers'
import { withRouteObservability } from '@/lib/observability'
import type { ApiResponse, Transaction } from '@/types'
import { NextResponse }             from 'next/server'

const transactionSelect = `
  *,
  account:accounts!transactions_account_id_fkey(id, name, color, icon),
  category:categories(id, name, color, icon)
`

async function getActiveCoupleId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data: couple } = await supabase
    .from('couple_profiles')
    .select('id')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .maybeSingle()

  return couple?.id ?? null
}

async function syncSplitForTransaction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  args: {
    transactionId: string
    userId: string
    type: Transaction['type']
    description: string
    date: string
    amount: number
  }
): Promise<void> {
  const coupleId = await getActiveCoupleId(supabase, args.userId)
  const eligible = shouldAutoSplitTransaction({
    hasCouple: !!coupleId,
    type: args.type,
    amount: args.amount,
  })

  if (!eligible) {
    await supabase
      .from('expense_splits')
      .delete()
      .eq('transaction_id', args.transactionId)
    return
  }

  const totalAmount = Math.round(args.amount * 100) / 100
  const { payer_amount: payerAmount, partner_amount: partnerAmount } = buildEqualSplitAmounts(totalAmount)

  const { data: existing } = await supabase
    .from('expense_splits')
    .select('id')
    .eq('transaction_id', args.transactionId)
    .maybeSingle()

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('expense_splits')
      .update({
        couple_id: coupleId,
        payer_id: args.userId,
        description: args.description,
        date: args.date,
        total_amount: totalAmount,
        split_mode: 'equal',
        payer_share_percent: 50,
        payer_amount: payerAmount,
        partner_amount: partnerAmount,
      })
      .eq('id', existing.id)

    if (updateError) throw updateError
    return
  }

  const { error: insertError } = await supabase
    .from('expense_splits')
    .insert({
      transaction_id: args.transactionId,
      couple_id: coupleId,
      payer_id: args.userId,
      description: args.description,
      date: args.date,
      total_amount: totalAmount,
      split_mode: 'equal',
      payer_share_percent: 50,
      payer_amount: payerAmount,
      partner_amount: partnerAmount,
      status: 'pending',
      settled_at: null,
    })

  if (insertError) throw insertError
}

// ── PATCH /api/transactions/:id ───────────────────────────────────────────────

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<Transaction>>> {
  return withRouteObservability(request, {
    route: '/api/transactions/[id]',
    operation: 'transactions_patch',
  }, async () => {
    const params = await props.params
    const limited = await checkRateLimitByIP('transactions:write')
    if (limited) return limited as NextResponse<ApiResponse<Transaction>>

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('transactions:write', user.id)
    if (userLimited) return userLimited as NextResponse<ApiResponse<Transaction>>

    const body = await request.json()

    // Remove campos que nao existem na tabela transactions
    // installments e logica de aplicacao — so usado no POST para criar parcelas
    const { installments: _b, ...rest } = body; void _b

    const parsed = createTransactionSchema.safeParse({ ...rest, installments: 1 })

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados invalidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    // Verifica que a transacao pertence ao usuario
    const { data: existing, error: findError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ data: null, error: 'Transacao nao encontrada' }, { status: 404 })
    }

    // Extrai apenas os campos editaveis — installments nao vai para o banco
    const { installments: _i, ...updateData } = parsed.data; void _i

    const { data, error } = await supabase
      .from('transactions')
      .update({
        account_id:  updateData.account_id,
        category_id: updateData.category_id ?? null,
        type:        updateData.type,
        amount:      updateData.amount,
        description: updateData.description,
        notes:       updateData.notes ?? null,
        date:        updateData.date,
        status:      updateData.status,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(transactionSelect)
      .single()

    if (error) throw error
    await syncSplitForTransaction(supabase, {
      transactionId: data.id,
      userId: user.id,
      type: data.type,
      description: data.description,
      date: data.date,
      amount: data.amount,
    })

    return NextResponse.json({ data, error: null })
  }) as Promise<NextResponse<ApiResponse<Transaction>>>
}

// ── DELETE /api/transactions/:id ──────────────────────────────────────────────

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<null>>> {
  return withRouteObservability(_request, {
    route: '/api/transactions/[id]',
    operation: 'transactions_delete',
  }, async () => {
    const params = await props.params
    const limited = await checkRateLimitByIP('transactions:write')
    if (limited) return limited as NextResponse<ApiResponse<null>>

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('transactions:write', user.id)
    if (userLimited) return userLimited as NextResponse<ApiResponse<null>>

    const { data: existing, error: findError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ data: null, error: 'Transacao nao encontrada' }, { status: 404 })
    }

    // Soft delete — o trigger recalcula saldo e fatura automaticamente
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) throw error
    await supabase
      .from('expense_splits')
      .delete()
      .eq('transaction_id', params.id)

    return NextResponse.json({ data: null, error: null })
  }) as Promise<NextResponse<ApiResponse<null>>>
}
