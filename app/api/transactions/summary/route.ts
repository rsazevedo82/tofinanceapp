import { createClient } from '@/lib/supabase/server'
import { ratelimit } from '@/lib/rateLimit'
import { headers } from 'next/headers'
import type { ApiResponse, Transaction } from '@/types'
import { NextResponse } from 'next/server'

async function getIP(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

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
    const accountId = searchParams.get('account_id')
    const invoiceId = searchParams.get('invoice_id')
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '60'), 200)
    const offset = parseInt(searchParams.get('offset') ?? '0')
    const targetUserId = searchParams.get('user_id') ?? user.id

    let query = supabase
      .from('transactions')
      .select(`
        id,
        user_id,
        account_id,
        category_id,
        invoice_id,
        installment_group_id,
        installment_number,
        type,
        amount,
        description,
        notes,
        date,
        status,
        deleted_at,
        created_at,
        updated_at
      `)
      .eq('user_id', targetUserId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (accountId) query = query.eq('account_id', accountId)
    if (invoiceId) query = query.eq('invoice_id', invoiceId)
    if (start) query = query.gte('date', start)
    if (end) query = query.lte('date', end)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: (data ?? []) as Transaction[], error: null })
  } catch (err) {
    console.error('[GET /api/transactions/summary]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
