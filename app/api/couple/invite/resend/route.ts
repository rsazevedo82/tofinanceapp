// app/api/couple/invite/resend/route.ts
// Cancela o convite pendente do usuário e cria um novo para o mesmo e-mail.
// Rate limit: 3 req / 10 min por IP — mais restritivo que o envio inicial.

import { createClient }  from '@/lib/supabase/server'
import { adminClient }   from '@/lib/supabase/admin'
import { log }           from '@/lib/logger'
import { headers }       from 'next/headers'
import { NextResponse }  from 'next/server'
import { Redis }         from '@upstash/redis'
import { Ratelimit }     from '@upstash/ratelimit'
import type { ApiResponse, CoupleInvitation } from '@/types'

const resendRatelimit = new Ratelimit({
  redis: new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  prefix:  'rl:couple:resend',
})

async function getIP(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

// ── POST /api/couple/invite/resend ────────────────────────────────────────────

export async function POST(): Promise<NextResponse<ApiResponse<CoupleInvitation>>> {
  try {
    // 1. Rate limiting
    const { success: allowed } = await resendRatelimit.limit(await getIP())
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: 'Muitas tentativas. Aguarde alguns minutos antes de reenviar.' },
        { status: 429 }
      )
    }

    // 2. Autenticação
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    // 3. Busca convite pendente do usuário — garante inviter_id = user.id
    const { data: existing, error: fetchError } = await adminClient
      .from('couple_invitations')
      .select('*')
      .eq('inviter_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (fetchError) throw fetchError

    if (!existing) {
      return NextResponse.json(
        { data: null, error: 'Nenhum convite pendente encontrado' },
        { status: 404 }
      )
    }

    const inviteeEmail = existing.invitee_email
    const normalizedInviteeEmail = inviteeEmail.trim().toLowerCase()

    // 4. Cancela o convite antigo (invalida token anterior)
    const { error: cancelError } = await adminClient
      .from('couple_invitations')
      .update({ status: 'cancelled' })
      .eq('id', existing.id)
      .eq('inviter_id', user.id) // dupla verificação de ownership

    if (cancelError) throw cancelError

    // 5. Reavalia se o invitee criou conta desde o convite original
    // (evita enviar e-mail para quem já tem conta e espera notificação in-app)
    const { data: currentInviteeId, error: inviteeLookupError } = await adminClient.rpc(
      'find_auth_user_id_by_email',
      { p_email: normalizedInviteeEmail }
    )
    if (inviteeLookupError) throw inviteeLookupError

    // 6. Cria novo convite com nova expiração e invitee_id atualizado
    const { data: invitation, error: inviteError } = await adminClient
      .from('couple_invitations')
      .insert({
        inviter_id:    user.id,
        invitee_email: normalizedInviteeEmail,
        invitee_id:    currentInviteeId ?? null,
        status:        'pending',
      })
      .select()
      .single()

    if (inviteError) throw inviteError

    // 7. Busca nome do inviter para notificação/e-mail
    const { data: inviterProfile } = await adminClient
      .from('user_profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()

    const inviterName = inviterProfile?.name ?? user.email?.split('@')[0] ?? 'Alguém'

    // 8. Re-envia via notificação (conta existente) ou e-mail Supabase (conta nova)
    if (currentInviteeId) {
      // Usuário existente → nova notificação in-app
      await adminClient.from('notifications').insert({
        user_id: currentInviteeId,
        type:    'couple_invite',
        title:   'Novo convite de perfil de casal',
        body:    `${inviterName} reenviou um convite para criar um perfil de casal com você.`,
        payload: { invitation_id: invitation.id, token: invitation.token, inviter_id: user.id },
      })
    } else {
      // Usuário novo → reenvio via Supabase Auth
      const { error: emailError } = await adminClient.auth.admin.inviteUserByEmail(normalizedInviteeEmail, {
        data: {
          couple_invitation_token: invitation.token,
          invited_by:              inviterName,
        },
      })
      if (emailError) {
        log('error', 'POST /api/couple/invite/resend — inviteUserByEmail falhou', {
          userId: user.id, inviteeEmail, detail: emailError.message,
        })
        await adminClient.from('couple_invitations').update({ status: 'cancelled' }).eq('id', invitation.id)
        return NextResponse.json(
          { data: null, error: `Erro ao reenviar e-mail: ${emailError.message}` },
          { status: 500 }
        )
      }
    }

    log('info', 'POST /api/couple/invite/resend', {
      userId:      user.id,
      inviteeEmail,
      newInviteId: invitation.id,
    })

    return NextResponse.json({ data: invitation, error: null }, { status: 201 })
  } catch (err) {
    log('error', 'POST /api/couple/invite/resend', { error: String(err) })
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
