import { createClient } from '@/lib/supabase/server'
import { createTransactionSchema } from '@/lib/validations/schemas'
import type { ApiResponse, Transaction } from '@/types'
import { NextResponse } from 'next/server'

const transactionSelect = `
  *,
  account:accounts!transactions_account_id_fkey(id, name, color, icon),
  category:categories(id, name, color, icon)
`

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Transaction[]>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate  = searchParams.get('start')
    const endDate    = searchParams.get('end')
    const accountId  = searchParams.get('account_id')
    const type       = searchParams.get('type')

    let query = supabase
      .from('transactions')
      .select(transactionSelect)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)

    if (startDate) query = query.gte('date', startDate)
    if (endDate)   query = query.lte('date', endDate)
    if (accountId) query = query.eq('account_id', accountId)
    if (type)      query = query.eq('type', type)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[GET /api/transactions]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Transaction>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createTransactionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', parsed.data.account_id)
      .single()

    if (accountError || !account) {
      return NextResponse.json(
        { data: null, error: 'Conta não encontrada' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...parsed.data, user_id: user.id })
      .select(transactionSelect)
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/transactions]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}