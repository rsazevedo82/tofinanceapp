import { headers } from 'next/headers'
import type { NextResponse } from 'next/server'
import { z } from 'zod'
import { clearAuthFailures, getAuthLock, registerAuthFailure } from '@/lib/authThrottle'
import { fail, logInternalError, ok } from '@/lib/apiResponse'
import type { ApiResponse } from '@/types'

const signupSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string()
    .min(10, 'Senha deve ter pelo menos 10 caracteres')
    .refine(val => /[a-zA-Z]/.test(val) && /[0-9]/.test(val), {
      message: 'Senha deve conter letras e numeros',
    }),
})

type SignupData = {
  session: {
    access_token: string
    refresh_token: string
  } | null
}

async function getIP(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<SignupData>>> {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'Dados invalidos')
    }

    const email = parsed.data.email.trim().toLowerCase()
    const ip = await getIP()

    const lock = await getAuthLock('signup', email, ip)
    if (lock.blocked) {
      return fail(429, `Muitas tentativas. Aguarde ${lock.retryAfter}s para tentar novamente.`)
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        email,
        password: parsed.data.password,
      }),
    })

    const json = await res.json()
    if (!res.ok || json?.error || json?.msg) {
      const failure = await registerAuthFailure('signup', email, ip)
      if (failure.blocked) {
        return fail(429, `Cadastro temporariamente bloqueado. Aguarde ${failure.retryAfter}s.`)
      }

      return fail(400, 'Nao foi possivel criar a conta com estes dados.')
    }

    await clearAuthFailures('signup', email, ip)

    return ok({
      session: json?.session
        ? {
          access_token: json.session.access_token,
          refresh_token: json.session.refresh_token,
        }
        : null,
    })
  } catch (err) {
    logInternalError('POST /api/auth/signup', err)
    return fail(500, 'Erro interno')
  }
}
