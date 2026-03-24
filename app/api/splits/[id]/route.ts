// app/api/splits/[id]/route.ts

import { createClient }      from '@/lib/supabase/server'
import { settleSplitSchema } from '@/lib/validations/schemas'
import { NextResponse }      from 'next/server'
import type { ApiResponse, ExpenseSplit } from '@/types'

type Params = { params: Promise<{ id: string }> }

function computeAmounts(split: { total_amount: number; payer_share_percent: number }) {
  const payer_amount   = Math.round(split.total_amount * split.payer_share_percent) / 100
  const partner_amount = Math.round((split.total_amount - payer_amount) * 100) / 100
  return { payer_amount, partner_amount }
}

// ── Helper: busca split e verifica acesso do parceiro ─────────────────────────

async function getSplitWithAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  splitId: string,
  userId: string
) {
  const { data: split, error } = await supabase
    .from('expense_splits')
    .select('*')
    .eq('id', splitId)
    .maybeSingle()

  if (error) throw error
  if (!split) return { split: null, isPartner: false, isPayer: false }

  // Verifica que o usuário é parceiro do casal deste split
  const { data: couple } = await supabase
    .from('couple_profiles')
    .select('id')
    .eq('id', split.couple_id)
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .maybeSingle()

  if (!couple) return { split: null, isPartner: false, isPayer: false }

  return {
    split,
    isPartner: true,
    isPayer: split.payer_id === userId,
  }
}

// ── PATCH /api/splits/[id] ────────────────────────────────────────────────────
// Quitar split: { settled_at: ISO string }

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse<ApiResponse<ExpenseSplit>>> {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { split, isPartner } = await getSplitWithAccess(supabase, id, user.id)
    if (!split)     return NextResponse.json({ data: null, error: 'Split não encontrado' }, { status: 404 })
    if (!isPartner) return NextResponse.json({ data: null, error: 'Sem permissão' },        { status: 403 })

    if (split.status === 'settled') {
      return NextResponse.json({ data: null, error: 'Split já foi quitado' }, { status: 409 })
    }

    const body   = await request.json()
    const parsed = settleSplitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('expense_splits')
      .update({ status: 'settled', settled_at: parsed.data.settled_at })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: { ...data, ...computeAmounts(data) }, error: null })
  } catch (err) {
    console.error('[PATCH /api/splits/[id]]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

// ── DELETE /api/splits/[id] ───────────────────────────────────────────────────
// Só o criador pode deletar, e apenas se ainda pendente

export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { split, isPayer } = await getSplitWithAccess(supabase, id, user.id)
    if (!split)  return NextResponse.json({ data: null, error: 'Split não encontrado' }, { status: 404 })
    if (!isPayer) return NextResponse.json({ data: null, error: 'Apenas quem criou pode remover' }, { status: 403 })
    if (split.status === 'settled') {
      return NextResponse.json({ data: null, error: 'Split quitado não pode ser removido' }, { status: 409 })
    }

    const { error } = await supabase
      .from('expense_splits')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/splits/[id]]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
