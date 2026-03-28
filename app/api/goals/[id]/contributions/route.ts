// app/api/goals/[id]/contributions/route.ts

import { createClient }           from '@/lib/supabase/server'
import { addContributionSchema }  from '@/lib/validations/schemas'
import { ratelimit }              from '@/lib/rateLimit'
import { insertAdminNotifications } from '@/lib/privileged/notificationsAdmin'
import { headers }                from 'next/headers'
import { NextResponse }           from 'next/server'
import type { ApiResponse, GoalContribution } from '@/types'

type Params = { params: Promise<{ id: string }> }

async function getIP() {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

// ── Helper: verifica que o usuário tem acesso à meta (dono ou parceiro de casal) ──

async function assertGoalAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  goalId: string,
  userId: string
) {
  const { data: goal, error } = await supabase
    .from('goals')
    .select('id, user_id, couple_id, status, target_amount, title')
    .eq('id', goalId)
    .maybeSingle()

  if (error) throw error
  if (!goal) return { goal: null, canContribute: false }

  // Dono sempre pode contribuir (se a meta estiver ativa)
  if (goal.user_id === userId) return { goal, canContribute: goal.status === 'active' }

  // Parceiro pode contribuir em metas de casal
  if (goal.couple_id) {
    const { data: couple } = await supabase
      .from('couple_profiles')
      .select('id')
      .eq('id', goal.couple_id)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .maybeSingle()

    if (couple) return { goal, canContribute: goal.status === 'active' }
  }

  return { goal, canContribute: false }
}

// ── GET /api/goals/[id]/contributions ─────────────────────────────────────────

export async function GET(_request: Request, { params }: Params): Promise<NextResponse<ApiResponse<GoalContribution[]>>> {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { goal } = await assertGoalAccess(supabase, id, user.id)
    if (!goal) {
      return NextResponse.json({ data: null, error: 'Meta não encontrada' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('goal_contributions')
      .select(`
        *,
        user_profile:user_profiles(id, name, avatar_url)
      `)
      .eq('goal_id', id)
      .order('date', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: data ?? [], error: null })
  } catch (err) {
    console.error('[GET /api/goals/[id]/contributions]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

// ── POST /api/goals/[id]/contributions ────────────────────────────────────────

export async function POST(request: Request, { params }: Params): Promise<NextResponse<ApiResponse<GoalContribution>>> {
  try {
    const { id } = await params

    const { success: allowed } = await ratelimit.limit(await getIP())
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { goal, canContribute } = await assertGoalAccess(supabase, id, user.id)
    if (!goal)         return NextResponse.json({ data: null, error: 'Meta não encontrada' }, { status: 404 })
    if (!canContribute) {
      const reason = goal.status !== 'active'
        ? 'Meta não está ativa'
        : 'Sem permissão para contribuir nesta meta'
      return NextResponse.json({ data: null, error: reason }, { status: 403 })
    }

    const body   = await request.json()
    const parsed = addContributionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { data: contribution, error: insertError } = await supabase
      .from('goal_contributions')
      .insert({ ...parsed.data, goal_id: id, user_id: user.id })
      .select()
      .single()

    if (insertError) throw insertError

    // Verifica se a meta foi atingida após este aporte
    const { data: sumResult } = await supabase
      .from('goal_contributions')
      .select('amount')
      .eq('goal_id', id)

    const total = (sumResult ?? []).reduce((acc, c) => acc + Number(c.amount), 0)

    if (total >= goal.target_amount) {
      // Marca meta como concluída
      await supabase
        .from('goals')
        .update({ status: 'completed' })
        .eq('id', id)
        .eq('status', 'active') // só atualiza se ainda estiver ativa (idempotente)

      // Envia notificação ao dono (e ao parceiro se for meta de casal)
      const notifyUsers = [goal.user_id]

      if (goal.couple_id) {
        const { data: couple } = await supabase
          .from('couple_profiles')
          .select('user_id_1, user_id_2')
          .eq('id', goal.couple_id)
          .maybeSingle()

        if (couple) {
          const partner = couple.user_id_1 === goal.user_id ? couple.user_id_2 : couple.user_id_1
          notifyUsers.push(partner)
        }
      }

      const notifications = notifyUsers.map(uid => ({
        user_id: uid,
        type:    'goal_reached' as const,
        title:   '🎯 Meta atingida!',
        body:    `Parabéns! A meta "${goal.title}" foi concluída.`,
        payload: { goal_id: id, total },
      }))

      await insertAdminNotifications(notifications)
    }

    return NextResponse.json({ data: contribution, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/goals/[id]/contributions]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
