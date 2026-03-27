// app/api/categories/[id]/route.ts
import { createClient }          from '@/lib/supabase/server'
import { updateCategorySchema }  from '@/lib/validations/schemas'
import { checkRateLimitByIP, checkRateLimitByUser } from '@/lib/apiHelpers'
import type { ApiResponse, Category } from '@/types'
import { NextResponse }          from 'next/server'

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<Category>>> {
  const params = await props.params;
  const limited = await checkRateLimitByIP('categories:write')
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('categories:write', user.id)
    if (userLimited) return userLimited

    const body   = await request.json()
    const parsed = updateCategorySchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados invalidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    const { data: existing, error: findError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { data: null, error: 'Categoria nao encontrada ou nao pode ser editada.' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('categories')
      .update(parsed.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[PATCH /api/categories/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<null>>> {
  const params = await props.params;
  const limited = await checkRateLimitByIP('categories:write')
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('categories:write', user.id)
    if (userLimited) return userLimited

    const { data: existing, error: findError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { data: null, error: 'Categoria nao encontrada ou nao pode ser excluida.' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/categories/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
