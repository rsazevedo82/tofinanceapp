// app/api/goals/[id]/route.ts

import { createClient }      from '@/lib/supabase/server'
import { updateGoalSchema }  from '@/lib/validations/schemas'
import { headers }           from 'next/headers'
import { NextResponse }      from 'next/server'
import type { ApiResponse, Goal } from '@/types'

type Params = { params: Promise<{ id: string }> }

// ── Helper: verifica que o usuário é dono da meta ──────────────────────────────

async function assertOwner(supabase: Awaited<ReturnType<typeof createClient>>, goalId: string, userId: string) {
  const { data, error } = await supabase
    .from('goals')
    .select('id, user_id, status')
    .eq('id', goalId)
    .maybeSingle()

  if (error) throw error
  if (!data)             return { goal: null, forbidden: false, notFound: true  }
  if (data.user_id !== userId) return { goal: data,  forbidden: true,  notFound: false }
  return { goal: data, forbidden: false, notFound: false }
}

// ── PATCH /api/goals/[id] ──────────────────────────────────────────────────────

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse<ApiResponse<Goal>>> {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { goal, forbidden, notFound } = await assertOwner(supabase, id, user.id)
    if (notFound)  return NextResponse.json({ data: null, error: 'Meta não encontrada' },  { status: 404 })
    if (forbidden) return NextResponse.json({ data: null, error: 'Sem permissão para editar esta meta' }, { status: 403 })
    if (goal?.status === 'archived') {
      return NextResponse.json({ data: null, error: 'Meta arquivada não pode ser editada' }, { status: 409 })
    }

    const body   = await request.json()
    const parsed = updateGoalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('goals')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[PATCH /api/goals/[id]]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

// ── DELETE /api/goals/[id] ─────────────────────────────────────────────────────
// Soft-delete: muda status para 'archived'

export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { forbidden, notFound } = await assertOwner(supabase, id, user.id)
    if (notFound)  return NextResponse.json({ data: null, error: 'Meta não encontrada' },  { status: 404 })
    if (forbidden) return NextResponse.json({ data: null, error: 'Sem permissão para arquivar esta meta' }, { status: 403 })

    const { error } = await supabase
      .from('goals')
      .update({ status: 'archived' })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/goals/[id]]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
