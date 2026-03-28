// app/api/couple/invite/route.ts

import { createClient }   from '@/lib/supabase/server'
import { adminClient }    from '@/lib/supabase/admin'
import { getRequestAuditMeta, recordAuditEvent } from '@/lib/audit'
import { ratelimit }      from '@/lib/rateLimit'
import { headers }        from 'next/headers'
import { NextResponse }   from 'next/server'
import { z }              from 'zod'
import type { ApiResponse, CoupleInvitation } from '@/types'

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
})

async function getIP() {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

// ── POST /api/couple/invite ───────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse<ApiResponse<CoupleInvitation>>> {
  try {
    const auditMeta = await getRequestAuditMeta()
    const { success: allowed } = await ratelimit.limit(await getIP())
    if (!allowed) {
      await recordAuditEvent({
        action: 'couple_invite_create',
        status: 'failure',
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'rate_limited' },
      })
      return NextResponse.json(
        { data: null, error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      await recordAuditEvent({
        action: 'couple_invite_create',
        status: 'failure',
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'unauthorized' },
      })
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const body   = await request.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      await recordAuditEvent({
        action: 'couple_invite_create',
        status: 'failure',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invalid_payload' },
      })
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message ?? 'Email inválido' },
        { status: 400 }
      )
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase()

    // Não pode convidar a si mesmo
    if (normalizedEmail === user.email?.toLowerCase()) {
      await recordAuditEvent({
        action: 'couple_invite_create',
        status: 'failure',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'self_invite' },
      })
      return NextResponse.json(
        { data: null, error: 'Você não pode se convidar' },
        { status: 400 }
      )
    }

    // Verifica se já tem vínculo ativo
    const { data: existingCouple } = await adminClient
      .from('couple_profiles')
      .select('id')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .maybeSingle()

    if (existingCouple) {
      await recordAuditEvent({
        action: 'couple_invite_create',
        status: 'failure',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'active_couple_exists' },
      })
      return NextResponse.json(
        { data: null, error: 'Você já possui um perfil de casal ativo' },
        { status: 400 }
      )
    }

    // Verifica se já enviou convite pendente para este email
    const { data: existingInvite } = await adminClient
      .from('couple_invitations')
      .select('id')
      .eq('inviter_id', user.id)
      .eq('invitee_email', normalizedEmail)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvite) {
      await recordAuditEvent({
        action: 'couple_invite_create',
        status: 'failure',
        userId: user.id,
        targetType: 'invitation',
        targetId: existingInvite.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'pending_invitation_exists' },
      })
      return NextResponse.json(
        { data: null, error: 'Já existe um convite pendente para este email' },
        { status: 400 }
      )
    }

    // Busca invitee por e-mail via função indexada no banco (evita listUsers completo)
    const { data: inviteeUserId, error: inviteeLookupError } = await adminClient.rpc(
      'find_auth_user_id_by_email',
      { p_email: normalizedEmail }
    )
    if (inviteeLookupError) throw inviteeLookupError

    // Cria o convite
    const { data: invitation, error: inviteError } = await adminClient
      .from('couple_invitations')
      .insert({
        inviter_id:    user.id,
        invitee_email: normalizedEmail,
        invitee_id:    inviteeUserId ?? null,
        status:        'pending',
      })
      .select()
      .single()

    if (inviteError) throw inviteError

    // Busca nome do inviter para a notificação
    const { data: inviterProfile } = await adminClient
      .from('user_profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()

    const inviterName = inviterProfile?.name ?? user.email?.split('@')[0] ?? 'Alguém'

    if (inviteeUserId) {
      // Usuário existente → notificação in-app
      await adminClient.from('notifications').insert({
        user_id: inviteeUserId,
        type:    'couple_invite',
        title:   'Convite de perfil de casal',
        body:    `${inviterName} convidou você para criar um perfil de casal.`,
        payload: { invitation_id: invitation.id, token: invitation.token, inviter_id: user.id },
      })
    } else {
      // Usuário novo → cria conta e envia email via Supabase
      const { error: emailError } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: {
          couple_invitation_token: invitation.token,
          invited_by:              inviterName,
        },
      })
      if (emailError) {
        console.error('[POST /api/couple/invite] inviteUserByEmail falhou:', emailError.message)
        // Cancela o convite criado para não deixar registro órfão
        await adminClient.from('couple_invitations').update({ status: 'cancelled' }).eq('id', invitation.id)
        await recordAuditEvent({
          action: 'couple_invite_create',
          status: 'failure',
          userId: user.id,
          targetType: 'invitation',
          targetId: invitation.id,
          ip: auditMeta.ip,
          userAgent: auditMeta.userAgent,
          metadata: { reason: 'invite_email_failed' },
        })
        return NextResponse.json(
          { data: null, error: 'Erro ao enviar o convite.' },
          { status: 500 }
        )
      }
    }

    await recordAuditEvent({
      action: 'couple_invite_create',
      status: 'success',
      userId: user.id,
      targetType: 'invitation',
      targetId: invitation.id,
      ip: auditMeta.ip,
      userAgent: auditMeta.userAgent,
      metadata: {
        invitee_email: normalizedEmail,
        invitee_id: inviteeUserId ?? null,
      },
    })

    return NextResponse.json({ data: invitation, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/couple/invite]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
