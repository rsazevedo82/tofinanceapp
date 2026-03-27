import { headers } from 'next/headers'
import { logInternalError } from '@/lib/apiResponse'
import { adminClient } from '@/lib/supabase/admin'

export type AuditStatus = 'success' | 'failure'

type AuditEventInput = {
  action: string
  status: AuditStatus
  userId?: string | null
  targetType?: string | null
  targetId?: string | null
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
}

export async function getRequestAuditMeta(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers()
  return {
    ip: h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1',
    userAgent: h.get('user-agent') ?? '',
  }
}

export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    const { error } = await adminClient.from('audit_events').insert({
      user_id: input.userId ?? null,
      action: input.action,
      status: input.status,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      metadata: input.metadata ?? {},
    })

    if (error) {
      logInternalError('audit:insert', error)
    }
  } catch (err) {
    logInternalError('audit:insert:unexpected', err)
  }
}
