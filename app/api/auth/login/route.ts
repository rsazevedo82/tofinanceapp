import { headers } from 'next/headers'
import type { NextResponse } from 'next/server'
import { z } from 'zod'
import { clearAuthFailures, getAuthLock, registerAuthFailure } from '@/lib/authThrottle'
import { fail, logInternalError, ok } from '@/lib/apiResponse'
import type { ApiResponse } from '@/types'

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Senha obrigatoria'),
})

type LoginSession = {
  access_token: string
  refresh_token: string
}

async function getIP(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<LoginSession>>> {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'Dados invalidos')
    }

    const email = parsed.data.email.trim().toLowerCase()
    const ip = await getIP()

    const lock = await getAuthLock('login', email, ip)
    if (lock.blocked) {
      return fail(429, `Muitas tentativas. Aguarde ${lock.retryAfter}s para tentar novamente.`)
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          email,
          password: parsed.data.password,
        }),
      }
    )

    const json = await res.json()

    if (!res.ok || !json?.access_token || !json?.refresh_token) {
      const failure = await registerAuthFailure('login', email, ip)
      if (failure.blocked) {
        return fail(429, `Conta temporariamente bloqueada. Aguarde ${failure.retryAfter}s.`)
      }

      return fail(401, 'Email ou senha incorretos')
    }

    await clearAuthFailures('login', email, ip)

    return ok({
      access_token: json.access_token,
      refresh_token: json.refresh_token,
    })
  } catch (err) {
    logInternalError('POST /api/auth/login', err)
    return fail(500, 'Erro interno')
  }
}
