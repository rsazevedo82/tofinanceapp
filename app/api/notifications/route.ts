// app/api/notifications/route.ts

import { createClient }                    from '@/lib/supabase/server'
import { ratelimit }                       from '@/lib/rateLimit'
import { headers }                         from 'next/headers'
import { NextResponse }                    from 'next/server'
import type { ApiResponse, Notification }  from '@/types'

async function getIP(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

// ── GET /api/notifications ────────────────────────────────────────────────────
// Query params:
//   ?unread=true  → apenas não lidas
//   ?limit=20     → máximo de registros (default 20, max 50)

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Notification[]>>> {
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

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit      = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.is('read_at', null)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
