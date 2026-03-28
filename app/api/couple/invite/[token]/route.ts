// app/api/couple/invite/[token]/route.ts

import { createClient }   from '@/lib/supabase/server'
import { getRequestAuditMeta, recordAuditEvent } from '@/lib/audit'
import {
  createCoupleProfile,
  getActiveCoupleByUserId,
  getPendingInvitationByToken,
  getUserProfileNameById,
  updateInvitationById,
} from '@/lib/privileged/coupleAdmin'
import { insertAdminNotifications } from '@/lib/privileged/notificationsAdmin'
import { NextResponse }   from 'next/server'
import type { ApiResponse } from '@/types'

type Params = { params: Promise<{ token: string }> }

// ── POST /api/couple/invite/[token]/accept ────────────────────────────────────

export async function POST(
  request: Request,
  { params }: Params
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const auditMeta = await getRequestAuditMeta()
    const { token }  = await params
    const { action } = await request.json() as { action: 'accept' | 'reject' }

    if (!['accept', 'reject'].includes(action)) {
      await recordAuditEvent({
        action: 'couple_invite_respond',
        status: 'failure',
        targetType: 'invitation',
        targetId: token,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invalid_action' },
      })
      return NextResponse.json({ data: null, error: 'Ação inválida' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      await recordAuditEvent({
        action: 'couple_invite_respond',
        status: 'failure',
        targetType: 'invitation',
        targetId: token,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'unauthorized' },
      })
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    // Busca e valida o convite
    const { data: invitation, error: inviteError } = await getPendingInvitationByToken(token)

    if (inviteError) throw inviteError
    if (!invitation) {
      await recordAuditEvent({
        action: 'couple_invite_respond',
        status: 'failure',
        userId: user.id,
        targetType: 'invitation',
        targetId: token,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invitation_not_found' },
      })
      return NextResponse.json(
        { data: null, error: 'Convite não encontrado ou já processado' },
        { status: 404 }
      )
    }

    // Verifica expiração
    if (new Date(invitation.expires_at) < new Date()) {
      await updateInvitationById(invitation.id, { status: 'cancelled' })
      await recordAuditEvent({
        action: 'couple_invite_respond',
        status: 'failure',
        userId: user.id,
        targetType: 'invitation',
        targetId: invitation.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invitation_expired' },
      })
      return NextResponse.json({ data: null, error: 'Convite expirado' }, { status: 410 })
    }

    // Verifica se o usuário logado é o destinatário
    if (invitation.invitee_email !== user.email?.toLowerCase() && invitation.invitee_id !== user.id) {
      await recordAuditEvent({
        action: 'couple_invite_respond',
        status: 'failure',
        userId: user.id,
        targetType: 'invitation',
        targetId: invitation.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invitation_not_owned' },
      })
      return NextResponse.json({ data: null, error: 'Este convite não é para você' }, { status: 403 })
    }

    if (action === 'reject') {
      await updateInvitationById(invitation.id, { status: 'rejected', invitee_id: user.id })

      await recordAuditEvent({
        action: 'couple_invite_respond',
        status: 'success',
        userId: user.id,
        targetType: 'invitation',
        targetId: invitation.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { response: 'reject' },
      })

      return NextResponse.json({ data: null, error: null })
    }

    // ── Aceitar ───────────────────────────────────────────────────────────────

    // Verifica se o aceitante já tem vínculo
    const { data: existingCouple } = await getActiveCoupleByUserId(user.id)

    if (existingCouple) {
      await recordAuditEvent({
        action: 'couple_invite_respond',
        status: 'failure',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'active_couple_exists', response: 'accept' },
      })
      return NextResponse.json(
        { data: null, error: 'Você já possui um perfil de casal ativo' },
        { status: 400 }
      )
    }

    // Garante ordem correta (user_id_1 < user_id_2)
    const [uid1, uid2] = [invitation.inviter_id, user.id].sort()

    // Cria o vínculo
    const { error: coupleError } = await createCoupleProfile(uid1, uid2)

    if (coupleError) throw coupleError

    // Atualiza convite
    await updateInvitationById(invitation.id, { status: 'accepted', invitee_id: user.id })

    // Busca nomes para notificações
    const [{ data: inviterProfile }, { data: inviteeProfile }] = await Promise.all([
      getUserProfileNameById(invitation.inviter_id),
      getUserProfileNameById(user.id),
    ])

    const inviterName  = inviterProfile?.name ?? 'Seu parceiro'
    const inviteeName  = inviteeProfile?.name ?? 'Seu parceiro'

    // Notifica ambos
    const now = new Date().toISOString()
    await insertAdminNotifications([
      {
        user_id:    invitation.inviter_id,
        type:       'couple_accepted',
        title:      'Perfil de casal ativado!',
        body:       `${inviteeName} aceitou seu convite. Vocês agora têm um perfil de casal.`,
        payload:    { partner_id: user.id },
        created_at: now,
      },
      {
        user_id:    user.id,
        type:       'couple_accepted',
        title:      'Perfil de casal ativado!',
        body:       `Você aceitou o convite de ${inviterName}. Vocês agora têm um perfil de casal.`,
        payload:    { partner_id: invitation.inviter_id },
        created_at: now,
      },
    ])

    await recordAuditEvent({
      action: 'couple_invite_respond',
      status: 'success',
      userId: user.id,
      targetType: 'invitation',
      targetId: invitation.id,
      ip: auditMeta.ip,
      userAgent: auditMeta.userAgent,
      metadata: {
        response: 'accept',
        inviter_id: invitation.inviter_id,
      },
    })

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[POST /api/couple/invite/[token]]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
