// app/api/accounts/route.ts
import { createClient }        from '@/lib/supabase/server'
import { createAccountSchema } from '@/lib/validations/schemas'
import { checkRateLimit }      from '@/lib/apiHelpers'
import type { ApiResponse, Account } from '@/types'
import { NextResponse }        from 'next/server'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Account[]>>> {
  const limited = await checkRateLimit()
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    // Suporte a visão do parceiro — RLS valida se o acesso é permitido
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('user_id') ?? user.id

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name')

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[GET /api/accounts]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Account>>> {
  const limited = await checkRateLimit()
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const body   = await request.json()
    const parsed = createAccountSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados invalidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    const { initial_balance, ...accountData } = parsed.data

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({ ...accountData, balance: 0, user_id: user.id })
      .select()
      .single()

    if (accountError) throw accountError

    if (initial_balance && initial_balance > 0) {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id:     user.id,
          account_id:  account.id,
          type:        'income',
          amount:      initial_balance,
          description: 'Saldo inicial',
          date:        today,
          status:      'confirmed',
        })

      if (txError) {
        await supabase.from('accounts').delete().eq('id', account.id)
        throw txError
      }

      // Trigger recalcula o saldo automaticamente
      const { data: updated } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', account.id)
        .single()

      return NextResponse.json({ data: updated, error: null }, { status: 201 })
    }

    return NextResponse.json({ data: account, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/accounts]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}