// app/api/accounts/[id]/route.ts
import { createClient }        from '@/lib/supabase/server'
import { invalidateSummaryCacheForUser } from '@/lib/summaryCache'
import { updateAccountSchema } from '@/lib/validations/schemas'
import { checkRateLimitByIP, checkRateLimitByUser } from '@/lib/apiHelpers'
import type { ApiResponse, Account } from '@/types'
import { NextResponse }        from 'next/server'

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<Account>>> {
  const params = await props.params;
  const limited = await checkRateLimitByIP('accounts:write')
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('accounts:write', user.id)
    if (userLimited) return userLimited

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
    await invalidateSummaryCacheForUser(user.id)
    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[PATCH /api/accounts/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<null>>> {
  const params = await props.params;
  const limited = await checkRateLimitByIP('accounts:write')
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('accounts:write', user.id)
    if (userLimited) return userLimited

    const { data: existing, error: findError } = await supabase
      .from('accounts')
      .select('id, type')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ data: null, error: 'Conta nao encontrada' }, { status: 404 })
    }

    const isCreditCard = existing.type === 'credit'

    if (isCreditCard) {
      // Cartão de crédito: requer senha para confirmar exclusão em cascata
      let body: { password?: string } = {}
      try { body = await request.json() } catch { /* body vazio */ }

      if (!body.password) {
        return NextResponse.json({ data: null, error: 'Senha obrigatória para excluir cartão' }, { status: 400 })
      }

      // Valida senha via re-autenticação
      const { data: userData } = await supabase.auth.getUser()
      const email = userData.user?.email
      if (!email) {
        return NextResponse.json({ data: null, error: 'Não foi possível identificar o usuário' }, { status: 400 })
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: body.password })
      if (signInError) {
        return NextResponse.json({ data: null, error: 'Senha incorreta' }, { status: 401 })
      }

      // Soft-delete de todas as transações do cartão
      const now = new Date().toISOString()
      await supabase
        .from('transactions')
        .update({ deleted_at: now })
        .eq('account_id', params.id)
        .is('deleted_at', null)

      // Soft-delete do cartão
      const { error } = await supabase
        .from('accounts')
        .update({ deleted_at: now, is_active: false })
        .eq('id', params.id)

      if (error) throw error
      await invalidateSummaryCacheForUser(user.id)
      return NextResponse.json({ data: null, error: null })
    }

    // Conta comum: bloqueia se houver transações ativas
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
    await invalidateSummaryCacheForUser(user.id)
    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/accounts/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
