// app/api/splits/route.ts

import { createClient }       from '@/lib/supabase/server'
import { createSplitSchema }  from '@/lib/validations/schemas'
import { ratelimit }          from '@/lib/rateLimit'
import { headers }            from 'next/headers'
import { NextResponse }       from 'next/server'
import type { ApiResponse, ExpenseSplit } from '@/types'

async function getIP() {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

function computeAmounts(split: { total_amount: number; payer_share_percent: number }) {
  const payer_amount   = Math.round(split.total_amount * split.payer_share_percent) / 100
  const partner_amount = Math.round((split.total_amount - payer_amount) * 100) / 100
  return { payer_amount, partner_amount }
}

// ── GET /api/splits ────────────────────────────────────────────────────────────
// ?status=pending | settled | all (default: all)

export async function GET(request: Request): Promise<NextResponse<ApiResponse<ExpenseSplit[]>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica casal ativo
    const { data: couple } = await supabase
      .from('couple_profiles')
      .select('id')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .maybeSingle()

    if (!couple) {
      return NextResponse.json({ data: [], error: null })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? 'all'

    let query = supabase
      .from('expense_splits')
      .select(`
        *,
        payer_profile:user_profiles!expense_splits_payer_id_fkey(id, name, avatar_url)
      `)
      .eq('couple_id', couple.id)
      .order('date', { ascending: false })

    if (status === 'pending') query = query.eq('status', 'pending')
    if (status === 'settled') query = query.eq('status', 'settled')

    const { data, error } = await query
    if (error) throw error

    const splits: ExpenseSplit[] = (data ?? []).map(s => ({
      ...s,
      ...computeAmounts(s),
    }))

    return NextResponse.json({ data: splits, error: null })
  } catch (err) {
    console.error('[GET /api/splits]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

// ── POST /api/splits ───────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse<ApiResponse<ExpenseSplit>>> {
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
    const parsed = createSplitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Valida que o couple_id pertence ao usuário
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

    const { data, error } = await supabase
      .from('expense_splits')
      .insert({ ...parsed.data, payer_id: user.id })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      { data: { ...data, ...computeAmounts(data) }, error: null },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/splits]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
