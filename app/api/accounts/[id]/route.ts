import { createClient } from '@/lib/supabase/server'
import { updateAccountSchema } from '@/lib/validations/schemas'
import type { ApiResponse, Account } from '@/types'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(
  request: Request,
  { params }: Params
): Promise<NextResponse<ApiResponse<Account>>> {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateAccountSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ data: null, error: 'Conta não encontrada' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('accounts')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[PATCH /api/accounts/[id]]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: Params
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ data: null, error: 'Conta não encontrada' }, { status: 404 })
    }

    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/accounts/[id]]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
