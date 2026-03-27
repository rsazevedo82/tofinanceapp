// app/api/profile/password/route.ts
import { createClient }          from '@/lib/supabase/server'
import { getIP, checkRateLimitByUser } from '@/lib/apiHelpers'
import { fail, logInternalError, ok } from '@/lib/apiResponse'
import { getRequestAuditMeta, recordAuditEvent } from '@/lib/audit'
import { notifySecurityEvent }   from '@/lib/securityAlerts'
import { changePasswordSchema }  from '@/lib/validations/schemas'
import { Ratelimit }             from '@upstash/ratelimit'
import { Redis }                 from '@upstash/redis'
import type { ApiResponse }      from '@/types'
import type { NextResponse }     from 'next/server'

// Rate limit estrito para troca de senha: 5 tentativas por minuto por IP
const passwordRatelimit = new Ratelimit({
  redis: new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix:  'ratelimit:password',
})

export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<null>>> {
  const ip = await getIP()
  const auditMeta = await getRequestAuditMeta()
  const { success } = await passwordRatelimit.limit(ip)
  if (!success) {
    await recordAuditEvent({
      action: 'auth_password_change',
      status: 'failure',
      ip: auditMeta.ip,
      userAgent: auditMeta.userAgent,
      metadata: { reason: 'rate_limited' },
    })
    return fail(429, 'Muitas tentativas. Aguarde 1 minuto.')
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      await recordAuditEvent({
        action: 'auth_password_change',
        status: 'failure',
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'unauthorized' },
      })
      return fail(401, 'Nao autorizado')
    }
    const userLimited = await checkRateLimitByUser('profile:write', user.id)
    if (userLimited) return userLimited

    const body   = await request.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      await recordAuditEvent({
        action: 'auth_password_change',
        status: 'failure',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invalid_payload' },
      })
      return fail(400, 'Dados invalidos')
    }

    const { currentPassword, newPassword } = parsed.data

    // Verifica senha atual via re-autenticação
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    user.email!,
      password: currentPassword,
    })
    if (signInError) {
      await recordAuditEvent({
        action: 'auth_password_change',
        status: 'failure',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invalid_current_password' },
      })
      return fail(400, 'Senha atual incorreta')
    }

    // Atualiza para nova senha
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      await recordAuditEvent({
        action: 'auth_password_change',
        status: 'failure',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'provider_update_failed' },
      })
      return fail(400, 'Nao foi possivel alterar a senha')
    }

    await recordAuditEvent({
      action: 'auth_password_change',
      status: 'success',
      userId: user.id,
      targetType: 'user',
      targetId: user.id,
      ip: auditMeta.ip,
      userAgent: auditMeta.userAgent,
    })

    notifySecurityEvent(
      user.id,
      'security_password_changed',
      'Senha alterada',
      'Sua senha foi alterada com sucesso. Se nao foi voce, altere novamente imediatamente.'
    ).catch((notifyErr) => logInternalError('security:password-changed', notifyErr))

    return ok(null)
  } catch (err) {
    logInternalError('PATCH /api/profile/password', err)
    return fail(500, 'Erro interno')
  }
}
