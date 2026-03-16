import { createClient } from '@/lib/supabase/server'
import { createTransactionSchema } from '@/lib/validations/schemas'
import type { ApiResponse, Transaction } from '@/types'
import { NextResponse } from 'next/server'

const transactionSelect = `
  *,
  account:accounts!transactions_account_id_fkey(id, name, color, icon),
  category:categories(id, name, color, icon)
`

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Transaction>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createTransactionSchema.safeParse(body)

    // Mesma substituição
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    // Verificar se a transação pertence ao usuário
    const { data: existing, error: findError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', params.id)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ data: null, error: 'Transação não encontrada' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(parsed.data)
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

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { data: existing, error: findError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', params.id)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ data: null, error: 'Transação não encontrada' }, { status: 404 })
    }

    // Soft delete
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