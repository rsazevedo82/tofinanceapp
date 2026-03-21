import { createClient } from '@/lib/supabase/server'
import { updateCategorySchema } from '@/lib/validations/schemas'
import type { ApiResponse, Category } from '@/types'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(
  request: Request,
  { params }: Params
): Promise<NextResponse<ApiResponse<Category>>> {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateCategorySchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    // Apenas categorias do próprio usuário podem ser editadas
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ data: null, error: 'Categoria não encontrada' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('categories')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[PATCH /api/categories/[id]]', err)
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
      .from('categories')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ data: null, error: 'Categoria não encontrada' }, { status: 404 })
    }

    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/categories/[id]]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
