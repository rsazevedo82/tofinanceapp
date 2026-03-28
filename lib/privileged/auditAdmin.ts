import { adminClient } from '@/lib/supabase/admin'

type AuditInsert = {
  user_id: string | null
  action: string
  status: 'success' | 'failure'
  target_type: string | null
  target_id: string | null
  ip: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
}

export async function insertAuditEvent(event: AuditInsert) {
  return adminClient.from('audit_events').insert(event)
}
