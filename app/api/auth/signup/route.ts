import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { clearAuthFailures, getAuthLock, registerAuthFailure } from '@/lib/authThrottle'
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
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message ?? 'Dados invalidos' },
        { status: 400 }
      )
    }

    const email = parsed.data.email.trim().toLowerCase()
    const ip = await getIP()

    const lock = await getAuthLock('signup', email, ip)
    if (lock.blocked) {
      return NextResponse.json(
        {
          data: null,
          error: `Muitas tentativas. Aguarde ${lock.retryAfter}s para tentar novamente.`,
        },
        { status: 429 }
      )
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
        return NextResponse.json(
          {
            data: null,
            error: `Cadastro temporariamente bloqueado. Aguarde ${failure.retryAfter}s.`,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { data: null, error: 'Nao foi possivel criar a conta com estes dados.' },
        { status: 400 }
      )
    }

    await clearAuthFailures('signup', email, ip)

    return NextResponse.json({
      data: {
        session: json?.session
          ? {
            access_token: json.session.access_token,
            refresh_token: json.session.refresh_token,
          }
          : null,
      },
      error: null,
    })
  } catch (err) {
    console.error('[POST /api/auth/signup]', err)
    return NextResponse.json(
      { data: null, error: 'Erro interno' },
      { status: 500 }
    )
  }
}
