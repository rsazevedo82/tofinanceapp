// app/api/goals/[id]/contributions/[cid]/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'
import type { ApiResponse } from '@/types'

type Params = { params: Promise<{ id: string; cid: string }> }

// ── DELETE /api/goals/[id]/contributions/[cid] ────────────────────────────────
// Apenas o dono do aporte pode removê-lo

export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id, cid } = await params

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    // Busca o aporte verificando que pertence à meta correta
    const { data: contribution, error: fetchError } = await supabase
      .from('goal_contributions')
      .select('id, user_id, goal_id')
      .eq('id', cid)
      .eq('goal_id', id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!contribution) {
      return NextResponse.json({ data: null, error: 'Aporte não encontrado' }, { status: 404 })
    }
    if (contribution.user_id !== user.id) {
      return NextResponse.json({ data: null, error: 'Sem permissão para remover este aporte' }, { status: 403 })
    }

    const { error } = await supabase
      .from('goal_contributions')
      .delete()
      .eq('id', cid)

    if (error) throw error

    // Se a meta estava 'completed', verifica se ainda atingiu o alvo após remoção
    const { data: goal } = await supabase
      .from('goals')
      .select('status, target_amount')
      .eq('id', id)
      .maybeSingle()

    if (goal?.status === 'completed') {
      const { data: sumResult } = await supabase
        .from('goal_contributions')
        .select('amount')
        .eq('goal_id', id)

      const total = (sumResult ?? []).reduce((acc, c) => acc + Number(c.amount), 0)

      if (total < goal.target_amount) {
        await supabase
          .from('goals')
          .update({ status: 'active' })
          .eq('id', id)
      }
    }

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/goals/[id]/contributions/[cid]]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
