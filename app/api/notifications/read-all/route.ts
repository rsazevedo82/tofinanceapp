// app/api/notifications/read-all/route.ts

import { createClient }   from '@/lib/supabase/server'
import { NextResponse }   from 'next/server'
import type { ApiResponse } from '@/types'

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
// Marca todas as notificações não lidas do usuário como lidas

export async function PATCH(): Promise<NextResponse<ApiResponse<{ count: number }>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)
      .select('id')

    if (error) throw error

    return NextResponse.json({ data: { count: data.length }, error: null })
  } catch (err) {
    console.error('[PATCH /api/notifications/read-all]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
