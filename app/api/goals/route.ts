// app/api/goals/route.ts

import { createClient }        from '@/lib/supabase/server'
import { createGoalSchema }    from '@/lib/validations/schemas'
import { ratelimit }           from '@/lib/rateLimit'
import { headers }             from 'next/headers'
import { NextResponse }        from 'next/server'
import type { ApiResponse, Goal } from '@/types'

async function getIP() {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

// ── GET /api/goals ────────────────────────────────────────────────────────────
// ?scope=individual | couple | all (default: all)

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Goal[]>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') ?? 'all'

    // Busca metas com soma dos aportes
    let query = supabase
      .from('goals')
      .select(`
        *,
        contributions:goal_contributions(amount)
      `)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (scope === 'individual') {
      query = query.eq('user_id', user.id).is('couple_id', null)
    } else if (scope === 'couple') {
      query = query.not('couple_id', 'is', null)
    }
    // 'all' — RLS já filtra o que o usuário pode ver

    const { data, error } = await query
    if (error) throw error

    // Calcula current_amount como soma dos aportes
    const goals: Goal[] = (data ?? []).map((g: Goal & { contributions: { amount: number }[] }) => ({
      ...g,
      current_amount: g.contributions?.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0,
      contributions:  undefined,
    }))

    return NextResponse.json({ data: goals, error: null })
  } catch (err) {
    console.error('[GET /api/goals]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

// ── POST /api/goals ───────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Goal>>> {
  try {
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

    const body   = await request.json()
    const parsed = createGoalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Se for meta de casal, valida que o couple_id pertence ao usuário
    if (parsed.data.couple_id) {
      const { data: couple } = await supabase
        .from('couple_profiles')
        .select('id')
        .eq('id', parsed.data.couple_id)
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
        .maybeSingle()

      if (!couple) {
        return NextResponse.json(
          { data: null, error: 'Perfil de casal não encontrado' },
          { status: 404 }
        )
      }
    }

    const { data, error } = await supabase
      .from('goals')
      .insert({ ...parsed.data, user_id: user.id })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: { ...data, current_amount: 0 }, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/goals]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
