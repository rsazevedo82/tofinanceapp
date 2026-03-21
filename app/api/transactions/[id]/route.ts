// app/api/transactions/[id]/route.ts
import { createClient }             from '@/lib/supabase/server'
import { createTransactionSchema }  from '@/lib/validations/schemas'
import type { ApiResponse, Transaction } from '@/types'
import { NextResponse }             from 'next/server'

const transactionSelect = `
  *,
  account:accounts!transactions_account_id_fkey(id, name, color, icon),
  category:categories(id, name, color, icon)
`

// ── PATCH /api/transactions/:id ───────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Transaction>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Remove campos que nao existem na tabela transactions
    // installments e logica de aplicacao — so usado no POST para criar parcelas
    const { installments: _bodyInstallments, ...rest } = body

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
    const { installments: _inst, ...updateData } = parsed.data

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

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[PATCH /api/transactions/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

// ── DELETE /api/transactions/:id ──────────────────────────────────────────────

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

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

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/transactions/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}