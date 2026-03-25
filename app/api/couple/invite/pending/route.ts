// app/api/couple/invite/pending/route.ts
// GET  → retorna o convite pendente enviado pelo usuário autenticado, se existir.
// DELETE → cancela o convite pendente do usuário autenticado.

import { createClient }  from '@/lib/supabase/server'
import { adminClient }   from '@/lib/supabase/admin'
import { ratelimit }     from '@/lib/rateLimit'
import { log }           from '@/lib/logger'
import { headers }       from 'next/headers'
import { NextResponse }  from 'next/server'
import type { ApiResponse, CoupleInvitation } from '@/types'

async function getIP(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

// ── GET /api/couple/invite/pending ───────────────────────────────────────────

export async function GET(): Promise<NextResponse<ApiResponse<CoupleInvitation | null>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { data: invitation, error } = await adminClient
      .from('couple_invitations')
      .select('*')
      .eq('inviter_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ data: invitation ?? null, error: null })
  } catch (err) {
    log('error', 'GET /api/couple/invite/pending', { error: String(err) })
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

// ── DELETE /api/couple/invite/pending ────────────────────────────────────────

export async function DELETE(): Promise<NextResponse<ApiResponse<null>>> {
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

    // Garante inviter_id = user.id — nunca cancela convite de outro usuário
    const { error } = await adminClient
      .from('couple_invitations')
      .update({ status: 'cancelled' })
      .eq('inviter_id', user.id)
      .eq('status', 'pending')

    if (error) throw error

    log('info', 'DELETE /api/couple/invite/pending', { userId: user.id })

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    log('error', 'DELETE /api/couple/invite/pending', { error: String(err) })
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
