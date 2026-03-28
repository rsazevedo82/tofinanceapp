import { adminClient } from '@/lib/supabase/admin'

export async function getActiveCoupleByUserId(userId: string) {
  return adminClient
    .from('couple_profiles')
    .select('*')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .maybeSingle()
}

export async function getUserProfileById(userId: string) {
  return adminClient
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
}

export async function getUserProfileNameById(userId: string) {
  return adminClient
    .from('user_profiles')
    .select('name')
    .eq('id', userId)
    .maybeSingle()
}

export async function getAuthUserById(userId: string) {
  return adminClient.auth.admin.getUserById(userId)
}

export async function findAuthUserIdByEmail(email: string) {
  return adminClient.rpc('find_auth_user_id_by_email', { p_email: email })
}

export async function inviteUserByEmail(email: string, data: Record<string, unknown>) {
  return adminClient.auth.admin.inviteUserByEmail(email, { data })
}

export async function getPendingInvitationByInviterAndEmail(inviterId: string, inviteeEmail: string) {
  return adminClient
    .from('couple_invitations')
    .select('id')
    .eq('inviter_id', inviterId)
    .eq('invitee_email', inviteeEmail)
    .eq('status', 'pending')
    .maybeSingle()
}

export async function createInvitation(params: {
  inviter_id: string
  invitee_email: string
  invitee_id: string | null
  status: 'pending'
}) {
  return adminClient
    .from('couple_invitations')
    .insert(params)
    .select()
    .single()
}

export async function cancelInvitationById(invitationId: string, inviterId?: string) {
  let query = adminClient
    .from('couple_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
  if (inviterId) {
    query = query.eq('inviter_id', inviterId)
  }
  return query
}

export async function getPendingInvitationByToken(token: string) {
  return adminClient
    .from('couple_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .maybeSingle()
}

export async function updateInvitationById(
  invitationId: string,
  patch: Record<string, unknown>
) {
  return adminClient
    .from('couple_invitations')
    .update(patch)
    .eq('id', invitationId)
}

export async function createCoupleProfile(userId1: string, userId2: string) {
  return adminClient
    .from('couple_profiles')
    .insert({ user_id_1: userId1, user_id_2: userId2 })
}

export async function deleteGoalsByCoupleId(coupleId: string) {
  return adminClient
    .from('goals')
    .delete()
    .eq('couple_id', coupleId)
}

export async function deleteCoupleById(coupleId: string) {
  return adminClient
    .from('couple_profiles')
    .delete()
    .eq('id', coupleId)
}

export async function cancelPendingInvitesForUsers(userId: string, partnerId: string) {
  return adminClient
    .from('couple_invitations')
    .update({ status: 'cancelled' })
    .or(`inviter_id.eq.${userId},inviter_id.eq.${partnerId}`)
    .eq('status', 'pending')
}

export async function getPendingInvitationByInviter(inviterId: string) {
  return adminClient
    .from('couple_invitations')
    .select('*')
    .eq('inviter_id', inviterId)
    .eq('status', 'pending')
    .maybeSingle()
}

export async function cancelPendingInvitationByInviter(inviterId: string) {
  return adminClient
    .from('couple_invitations')
    .update({ status: 'cancelled' })
    .eq('inviter_id', inviterId)
    .eq('status', 'pending')
}

export async function getLatestReceivedPendingInvitation(params: {
  userId: string
  normalizedEmail?: string
}) {
  const { userId, normalizedEmail } = params
  const orFilter = normalizedEmail
    ? `invitee_id.eq.${userId},invitee_email.eq.${normalizedEmail}`
    : `invitee_id.eq.${userId}`

  return adminClient
    .from('couple_invitations')
    .select('*')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(1)
}
