// app/api/accounts/[id]/route.ts
import { createClient }        from '@/lib/supabase/server'
import { updateAccountSchema } from '@/lib/validations/schemas'
import { checkRateLimit }      from '@/lib/apiHelpers'
import type { ApiResponse, Account } from '@/types'
import { NextResponse }        from 'next/server'

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<Account>>> {
  const params = await props.params;
  const limited = await checkRateLimit()
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const body   = await request.json()
    const parsed = updateAccountSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados invalidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    const { data: existing, error: findError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ data: null, error: 'Conta nao encontrada' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('accounts')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[PATCH /api/accounts/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<null>>> {
  const params = await props.params;
  const limited = await checkRateLimit()
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const { data: existing, error: findError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ data: null, error: 'Conta nao encontrada' }, { status: 404 })
    }

    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', params.id)
      .is('deleted_at', null)

    if (count && count > 0) {
      return NextResponse.json(
        { data: null, error: `Nao e possivel excluir: conta possui ${count} transacao(oes) ativa(s).` },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('accounts')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/accounts/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}