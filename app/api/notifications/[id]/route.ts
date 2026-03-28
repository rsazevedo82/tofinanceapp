// app/api/notifications/[id]/route.ts

import { createClient }                   from '@/lib/supabase/server'
import { checkRateLimitByIP, checkRateLimitByUser } from '@/lib/apiHelpers'
import { withRouteObservability } from '@/lib/observability'
import { NextResponse }                   from 'next/server'
import type { ApiResponse, Notification } from '@/types'

// ── PATCH /api/notifications/[id]/read ───────────────────────────────────────
// Marca uma notificação específica como lida

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Notification>>> {
  return withRouteObservability(request, {
    route: '/api/notifications/[id]',
    operation: 'notifications_patch',
  }, async () => {
    const limited = await checkRateLimitByIP('notifications:write')
    if (limited) return limited as NextResponse<ApiResponse<Notification>>

    const { id } = await params

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('notifications:write', user.id)
    if (userLimited) return userLimited as NextResponse<ApiResponse<Notification>>

    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)   // RLS + validação extra
      .is('read_at', null)       // idempotente: não atualiza se já lida
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ data: null, error: 'Notificação não encontrada' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ data, error: null })
  }) as Promise<NextResponse<ApiResponse<Notification>>>
}
