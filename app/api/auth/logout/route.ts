// app/api/auth/logout/route.ts
import { createClient }  from '@/lib/supabase/server'
import type { NextResponse } from 'next/server'
import { fail, logInternalError, ok } from '@/lib/apiResponse'
import { getRequestAuditMeta, recordAuditEvent } from '@/lib/audit'
import type { ApiResponse } from '@/types'

export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const meta = await getRequestAuditMeta()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) {
      await recordAuditEvent({
        action: 'auth_logout',
        status: 'failure',
        userId: user?.id ?? null,
        ip: meta.ip,
        userAgent: meta.userAgent,
        metadata: { reason: 'signout_failed' },
      })
      return fail(500, 'Nao foi possivel encerrar a sessao')
    }

    await recordAuditEvent({
      action: 'auth_logout',
      status: 'success',
      userId: user?.id ?? null,
      targetType: 'session',
      targetId: user?.id ?? null,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return ok(null)
  } catch (err) {
    logInternalError('POST /api/auth/logout', err)
    return fail(500, 'Erro interno')
  }
}
