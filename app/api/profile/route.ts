// app/api/profile/route.ts
import { createClient }        from '@/lib/supabase/server'
import { checkRateLimitByIP, checkRateLimitByUser } from '@/lib/apiHelpers'
import { logInternalError }    from '@/lib/apiResponse'
import { getRequestAuditMeta, recordAuditEvent } from '@/lib/audit'
import { notifySecurityEvent } from '@/lib/securityAlerts'
import { updateProfileSchema } from '@/lib/validations/schemas'
import type { ApiResponse, UserProfile } from '@/types'
import { NextResponse }        from 'next/server'

export async function GET(): Promise<NextResponse<ApiResponse<UserProfile>>> {
  const limited = await checkRateLimitByIP('profile:get')
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('profile:get', user.id)
    if (userLimited) return userLimited

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, name, avatar_url')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json({
      data: {
        id:         user.id,
        name:       profile?.name ?? null,
        email:      user.email ?? '',
        avatar_url: profile?.avatar_url ?? null,
      },
      error: null,
    })
  } catch (err) {
    console.error('[GET /api/profile]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<UserProfile>>> {
  const limited = await checkRateLimitByIP('profile:write')
  if (limited) return limited

  try {
    const auditMeta = await getRequestAuditMeta()
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      await recordAuditEvent({
        action: 'profile_update',
        status: 'failure',
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'unauthorized' },
      })
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('profile:write', user.id)
    if (userLimited) return userLimited

    const body   = await request.json()
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos'
      await recordAuditEvent({
        action: 'profile_update',
        status: 'failure',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invalid_payload' },
      })
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    const { name, email } = parsed.data

    // Atualiza nome na tabela user_profiles
    if (name !== undefined) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, name, updated_at: new Date().toISOString() })

      if (profileError) throw profileError
    }

    // Atualiza e-mail no Supabase Auth (dispara e-mail de confirmação)
    if (email !== undefined && email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email })
      if (emailError) {
        logInternalError('PATCH /api/profile email update', emailError)
        await recordAuditEvent({
          action: 'auth_email_change_requested',
          status: 'failure',
          userId: user.id,
          targetType: 'user',
          targetId: user.id,
          ip: auditMeta.ip,
          userAgent: auditMeta.userAgent,
          metadata: { reason: 'provider_update_failed' },
        })
        return NextResponse.json({ data: null, error: 'Nao foi possivel solicitar a alteracao de e-mail' }, { status: 400 })
      }

      await recordAuditEvent({
        action: 'auth_email_change_requested',
        status: 'success',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { new_email: email },
      })

      notifySecurityEvent(
        user.id,
        'security_email_change_requested',
        'Solicitacao de alteracao de e-mail',
        `Recebemos uma solicitacao para alterar o e-mail da sua conta para ${email}.`,
        { new_email: email }
      ).catch((notifyErr) => logInternalError('security:email-change-requested', notifyErr))
    }

    // Retorna perfil atualizado
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, name, avatar_url')
      .eq('id', user.id)
      .single()

    await recordAuditEvent({
      action: 'profile_update',
      status: 'success',
      userId: user.id,
      targetType: 'user',
      targetId: user.id,
      ip: auditMeta.ip,
      userAgent: auditMeta.userAgent,
      metadata: {
        changed_fields: Object.keys(parsed.data),
      },
    })

    return NextResponse.json({
      data: {
        id:         user.id,
        name:       profile?.name ?? null,
        email:      email ?? user.email ?? '',
        avatar_url: profile?.avatar_url ?? null,
      },
      error: null,
    })
  } catch (err) {
    console.error('[PATCH /api/profile]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
