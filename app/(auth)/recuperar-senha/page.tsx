'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ApiResponse } from '@/types'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export default function RecuperarSenhaPage() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [requiresCaptcha, setRequiresCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const widgetContainerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmit = emailLooksValid && (!requiresCaptcha || !!captchaToken) && !loading

  useEffect(() => {
    if (!requiresCaptcha || !turnstileSiteKey || !widgetContainerRef.current) return

    let disposed = false
    let currentScript: HTMLScriptElement | null = null

    const renderWidget = () => {
      if (disposed || !window.turnstile || !widgetContainerRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token: string) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken(''),
      })
    }

    if (window.turnstile) {
      renderWidget()
      return () => {
        disposed = true
      }
    }

    const existingScript = document.querySelector('script[data-turnstile="true"]') as HTMLScriptElement | null
    const handleLoad = () => renderWidget()

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad)
      return () => {
        disposed = true
        existingScript.removeEventListener('load', handleLoad)
      }
    }

    currentScript = document.createElement('script')
    currentScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    currentScript.async = true
    currentScript.defer = true
    currentScript.setAttribute('data-turnstile', 'true')
    currentScript.addEventListener('load', handleLoad)
    document.head.appendChild(currentScript)

    return () => {
      disposed = true
      currentScript?.removeEventListener('load', handleLoad)
    }
  }, [requiresCaptcha, turnstileSiteKey])

  function resetCaptchaState() {
    setCaptchaToken('')
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (requiresCaptcha && !captchaToken) {
      setError('Confirme que voce e humano para continuar.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/password-recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        captchaToken: captchaToken || undefined,
      }),
    })

    const json: ApiResponse<{ message: string }> = await res.json()

    if (!res.ok || json.error) {
      if (res.status === 429) {
        setRequiresCaptcha(true)
      }
      resetCaptchaState()
      setError(json.error ?? 'Nao foi possivel processar a solicitacao. Tente novamente.')
      setLoading(false)
      return
    }

    setRequiresCaptcha(false)
    resetCaptchaState()
    setSuccess(json.data?.message ?? 'Se o email existir, voce recebera um link para redefinir a senha.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-[#FFF5F0]">
        <div className="flex flex-col items-center gap-8 px-12">
          <Link href="/" aria-label="Ir para Visão geral">
            <Image
              src="/n2r-logo-completo-horizontal-cor-V1.png"
              alt="Nos 2 Reais"
              width={260}
              height={80}
              priority
            />
          </Link>
          <div className="text-center space-y-1.5">
            <p className="text-sm text-[#334155]">Recupere o acesso com seguranca.</p>
            <p className="text-sm text-[#334155]">Vamos enviar um link para seu email.</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-[#D1D5DB]" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Link href="/" aria-label="Ir para Visão geral">
              <Image
                src="/n2r-simbolo-principal-claro-V1.png"
                alt="Nos 2 Reais"
                width={28}
                height={28}
                className="rounded-md"
              />
            </Link>
            <span className="text-base font-bold text-[#0F172A] tracking-tight">Nos 2 Reais</span>
          </div>

          <div
            className="rounded-2xl p-6 md:p-7 bg-white"
            style={{ border: '1px solid #E5E7EB', boxShadow: '0 8px 28px rgba(15,23,42,0.06)' }}
          >
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight mb-1">Recuperar senha</h1>
            <p className="text-sm mb-8 text-[#334155]">Informe seu email para receber o link</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                {email.length > 0 && !emailLooksValid && (
                  <p className="error-msg">Digite um email válido.</p>
                )}
              </div>

              {error && (
                <p className="alert-box alert-box-error">
                  {error}
                </p>
              )}

              {success && (
                <p className="alert-box alert-box-success">
                  {success}
                </p>
              )}

              {requiresCaptcha && (
                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                  {turnstileSiteKey ? (
                    <div ref={widgetContainerRef} className="min-h-[65px]" />
                  ) : (
                    <p className="text-xs text-red-600">
                      Configuracao ausente: defina `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full justify-center py-2.5"
                disabled={!canSubmit}
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>

            <p className="text-center text-sm mt-6 text-[#334155]">
              Lembrou sua senha?{' '}
              <Link href="/login" className="text-[#C2410C] font-medium hover:text-[#9A3412] transition-colors">
                Voltar para login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

