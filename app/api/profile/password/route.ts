// app/api/profile/password/route.ts
import { createClient }          from '@/lib/supabase/server'
import { getIP }                 from '@/lib/apiHelpers'
import { changePasswordSchema }  from '@/lib/validations/schemas'
import { Ratelimit }             from '@upstash/ratelimit'
import { Redis }                 from '@upstash/redis'
import type { ApiResponse }      from '@/types'
import { NextResponse }          from 'next/server'

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
    return NextResponse.json(
      { data: null, error: 'Muitas tentativas. Aguarde 1 minuto.' },
      { status: 429 }
    )
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const body   = await request.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    const { currentPassword, newPassword } = parsed.data

    // Verifica senha atual via re-autenticação
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    user.email!,
      password: currentPassword,
    })
    if (signInError) {
      return NextResponse.json({ data: null, error: 'Senha atual incorreta' }, { status: 400 })
    }

    // Atualiza para nova senha
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      return NextResponse.json({ data: null, error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[PATCH /api/profile/password]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
