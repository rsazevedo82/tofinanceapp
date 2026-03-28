import { headers } from 'next/headers'
import { z } from 'zod'
import { fail, logInternalError, ok } from '@/lib/apiResponse'
import { recordAuditEvent } from '@/lib/audit'
import {
  applyPasswordRecoveryCooldown,
  checkPasswordRecoveryThrottle,
  hashEmailForSecurity,
} from '@/lib/passwordRecoveryThrottle'
import type { ApiResponse } from '@/types'
import type { NextResponse } from 'next/server'

const requestSchema = z.object({
  email: z.string().email('Email invalido'),
  captchaToken: z.string().min(1).optional(),
})

type PasswordRecoveryResponse = {
  message: string
}

const GENERIC_SUCCESS_MESSAGE =
  'Se o email existir, voce recebera um link para redefinir a senha.'

async function getRequestMeta(): Promise<{ ip: string; userAgent: string; origin: string | null }> {
  const h = await headers()
  return {
    ip: h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1',
    userAgent: h.get('user-agent') ?? '',
    origin: h.get('origin'),
  }
}

function resolveRedirectTo(origin: string | null): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (appUrl) return `${appUrl.replace(/\/$/, '')}/atualizar-senha`

  if (origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:')) {
    return `${origin.replace(/\/$/, '')}/atualizar-senha`
  }

  return 'https://www.nos2reais.com.br/atualizar-senha'
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true

  const body = new URLSearchParams()
  body.set('secret', secret)
  body.set('response', token)
  body.set('remoteip', ip)

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) return false
  const json = await response.json() as { success?: boolean }
  return !!json.success
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<PasswordRecoveryResponse>>> {
  try {
    const meta = await getRequestMeta()
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      await recordAuditEvent({
        action: 'auth_password_recovery_request',
        status: 'failure',
        ip: meta.ip,
        userAgent: meta.userAgent,
        metadata: { reason: 'invalid_payload' },
      })
      return fail(400, 'Dados invalidos')
    }

    const email = parsed.data.email.trim().toLowerCase()
    const emailHash = hashEmailForSecurity(email)
    const throttle = await checkPasswordRecoveryThrottle({
      email,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    if (!throttle.allowed) {
      await recordAuditEvent({
        action: 'auth_password_recovery_request',
        status: 'failure',
        ip: meta.ip,
        userAgent: meta.userAgent,
        metadata: {
          reason: 'rate_limited',
          retry_after: throttle.retryAfter,
          email_hash: emailHash,
        },
      })
      return ok({ message: GENERIC_SUCCESS_MESSAGE })
    }

    if (throttle.requireCaptcha && process.env.TURNSTILE_SECRET_KEY) {
      if (!parsed.data.captchaToken) {
        await recordAuditEvent({
          action: 'auth_password_recovery_request',
          status: 'failure',
          ip: meta.ip,
          userAgent: meta.userAgent,
          metadata: { reason: 'captcha_required', email_hash: emailHash },
        })
        return fail(429, 'Verificacao adicional necessaria. Aguarde e tente novamente.')
      }

      const captchaOk = await verifyTurnstile(parsed.data.captchaToken, meta.ip)
      if (!captchaOk) {
        await recordAuditEvent({
          action: 'auth_password_recovery_request',
          status: 'failure',
          ip: meta.ip,
          userAgent: meta.userAgent,
          metadata: { reason: 'captcha_invalid', email_hash: emailHash },
        })
        return fail(400, 'Falha na verificacao de seguranca.')
      }
    }

    const redirectTo = resolveRedirectTo(meta.origin)
    const providerResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/recover`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ email, redirect_to: redirectTo }),
      }
    )

    await applyPasswordRecoveryCooldown(email)

    if (!providerResponse.ok) {
      await recordAuditEvent({
        action: 'auth_password_recovery_request',
        status: 'failure',
        ip: meta.ip,
        userAgent: meta.userAgent,
        metadata: {
          reason: 'provider_rejected',
          provider_status: providerResponse.status,
          email_hash: emailHash,
        },
      })
      return ok({ message: GENERIC_SUCCESS_MESSAGE })
    }

    await recordAuditEvent({
      action: 'auth_password_recovery_request',
      status: 'success',
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { email_hash: emailHash },
    })

    return ok({ message: GENERIC_SUCCESS_MESSAGE })
  } catch (err) {
    logInternalError('POST /api/auth/password-recovery', err)
    return fail(500, 'Erro interno')
  }
}
