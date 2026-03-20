import { createClient } from '@/lib/supabase/server'
import { createTransactionSchema } from '@/lib/validations/schemas'
import { ratelimit } from '@/lib/rateLimit'
import { headers } from 'next/headers'
import type { ApiResponse, Transaction } from '@/types'
import { NextResponse } from 'next/server'

const transactionSelect = `
  *,
  account:accounts!transactions_account_id_fkey(id, name, color, icon),
  category:categories(id, name, color, icon)
`

async function getIP(): Promise<string> {
  const headersList = await headers()
  return headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? '127.0.0.1'
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Transaction[]>>> {
  try {
    const { success: allowed } = await ratelimit.limit(await getIP())
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate   = searchParams.get('end')
    const accountId = searchParams.get('account_id')
    const type      = searchParams.get('type')

    let dbQuery = supabase
      .from('transactions')
      .select(transactionSelect)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500)

    if (startDate) dbQuery = dbQuery.gte('date', startDate)
    if (endDate)   dbQuery = dbQuery.lte('date', endDate)
    if (accountId) dbQuery = dbQuery.eq('account_id', accountId)
    if (type)      dbQuery = dbQuery.eq('type', type)

    const { data, error } = await dbQuery
    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[GET /api/transactions]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Transaction>>> {
  try {
    const { success: allowed } = await ratelimit.limit(await getIP())
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createTransactionSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos'
      return NextResponse.json(
        { data: null, error: message },
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