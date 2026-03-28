import { adminClient } from '@/lib/supabase/admin'

type RetentionResult = {
  audit_events_deleted: number
  invitations_deleted: number
}

function toIsoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export async function runPrivacyRetentionJob(params?: {
  auditRetentionDays?: number
  invitationRetentionDays?: number
}): Promise<RetentionResult> {
  const auditRetentionDays = params?.auditRetentionDays ?? 180
  const invitationRetentionDays = params?.invitationRetentionDays ?? 30

  const auditCutoff = toIsoDaysAgo(auditRetentionDays)
  const inviteCutoff = toIsoDaysAgo(invitationRetentionDays)
  const nowIso = new Date().toISOString()

  const { data: auditDeletedRows, error: auditDeleteError } = await (
    adminClient
      .from('audit_events')
      .delete()
      .lt('created_at', auditCutoff)
      .select('id')
  )
  if (auditDeleteError) throw auditDeleteError

  const { data: terminalInviteRows, error: terminalInviteError } = await (
    adminClient
      .from('couple_invitations')
      .delete()
      .in('status', ['accepted', 'rejected', 'cancelled'])
      .lt('updated_at', inviteCutoff)
      .select('id')
  )
  if (terminalInviteError) throw terminalInviteError

  const { data: expiredPendingRows, error: expiredPendingError } = await (
    adminClient
      .from('couple_invitations')
      .delete()
      .eq('status', 'pending')
      .lt('expires_at', nowIso)
      .lt('created_at', inviteCutoff)
      .select('id')
  )
  if (expiredPendingError) throw expiredPendingError

  const audit_events_deleted = auditDeletedRows?.length ?? 0
  const terminalInvitesDeleted = terminalInviteRows?.length ?? 0
  const expiredPendingDeleted = expiredPendingRows?.length ?? 0

  return {
    audit_events_deleted,
    invitations_deleted: terminalInvitesDeleted + expiredPendingDeleted,
  }
}
