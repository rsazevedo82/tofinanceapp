import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { clearAuthFailures, getAuthLock, registerAuthFailure } from '@/lib/authThrottle'
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
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message ?? 'Dados invalidos' },
        { status: 400 }
      )
    }

    const email = parsed.data.email.trim().toLowerCase()
    const ip = await getIP()

    const lock = await getAuthLock('login', email, ip)
    if (lock.blocked) {
      return NextResponse.json(
        {
          data: null,
          error: `Muitas tentativas. Aguarde ${lock.retryAfter}s para tentar novamente.`,
        },
        { status: 429 }
      )
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
        return NextResponse.json(
          {
            data: null,
            error: `Conta temporariamente bloqueada. Aguarde ${failure.retryAfter}s.`,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { data: null, error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    await clearAuthFailures('login', email, ip)

    return NextResponse.json({
      data: {
        access_token: json.access_token,
        refresh_token: json.refresh_token,
      },
      error: null,
    })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json(
      { data: null, error: 'Erro interno' },
      { status: 500 }
    )
  }
}
