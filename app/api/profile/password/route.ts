// app/api/profile/password/route.ts
import { createClient }          from '@/lib/supabase/server'
import { getIP, checkRateLimitByUser } from '@/lib/apiHelpers'
import { fail, logInternalError, ok } from '@/lib/apiResponse'
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
  const { success } = await passwordRatelimit.limit(ip)
  if (!success) {
    return fail(429, 'Muitas tentativas. Aguarde 1 minuto.')
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return fail(401, 'Nao autorizado')
    }
    const userLimited = await checkRateLimitByUser('profile:write', user.id)
    if (userLimited) return userLimited

    const body   = await request.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'Dados invalidos')
    }

    const { currentPassword, newPassword } = parsed.data

    // Verifica senha atual via re-autenticação
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    user.email!,
      password: currentPassword,
    })
    if (signInError) {
      return fail(400, 'Senha atual incorreta')
    }

    // Atualiza para nova senha
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      return fail(400, 'Nao foi possivel alterar a senha')
    }

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
