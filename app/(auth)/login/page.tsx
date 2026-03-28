'use client'

import { useState }       from 'react'
import Image              from 'next/image'
import Link               from 'next/link'
import { createClient }   from '@/lib/supabase/client'
import { useRouter }      from 'next/navigation'
import { useToast }       from '@/components/providers/ToastProvider'

type LoginResponse = {
  data: {
    access_token: string
    refresh_token: string
  } | null
  error: string | null
}

export default function LoginPage() {
  const emailInputId = 'login-email'
  const passwordInputId = 'login-password'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json: LoginResponse = await res.json()

    if (!res.ok || json.error || !json.data) {
      const message = json.error ?? 'Email ou senha incorretos'
      setError(message)
      showToast({ title: 'Falha no login', description: message, variant: 'error' })
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: json.data.access_token,
      refresh_token: json.data.refresh_token,
    })
    if (sessionError) {
      const message = 'Falha ao iniciar sessao. Tente novamente.'
      setError(message)
      showToast({ title: 'Falha no login', description: message, variant: 'error' })
      setLoading(false)
      return
    }

    showToast({ title: 'Login realizado', variant: 'success' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex">

      {/* ── Painel esquerdo (oculto em mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-[#FFF5F0]">
        <div className="flex flex-col items-center gap-8 px-12">
          <Link href="/" aria-label="Ir para Visão geral">
            <Image
              src="/n2r-logo-completo-horizontal-cor-V1.png"
              alt="Nós 2 Reais"
              width={260}
              height={80}
              priority
            />
          </Link>
          <div className="text-center space-y-1.5">
            <p className="text-sm text-[#334155]">Sem brigas por dinheiro.</p>
            <p className="text-sm text-[#334155]">Organizem a vida financeira juntos.</p>
          </div>
        </div>
        {/* Divisor vertical */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-[#D1D5DB]" />
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Link href="/" aria-label="Ir para Visão geral">
              <Image
                src="/n2r-simbolo-principal-claro-V1.png"
                alt="Nós 2 Reais"
                width={28}
                height={28}
                className="rounded-md"
              />
            </Link>
            <span className="text-base font-bold text-[#0F172A] tracking-tight">
              Nós 2 Reais
            </span>
          </div>

          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight mb-1">Entrar</h1>
          <p className="text-sm mb-8 text-[#334155]">Acesse sua conta</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label" htmlFor={emailInputId}>Email</label>
              <input
                id={emailInputId}
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor={passwordInputId}>Senha</label>
              <div className="relative">
                <input
                  id={passwordInputId}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-24"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#334155] hover:text-[#0F172A] transition-colors"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>

            <p className="text-right">
              <Link href="/recuperar-senha" className="text-xs text-[#334155] hover:text-[#C2410C] transition-colors">
                Esqueci minha senha
              </Link>
            </p>
          </form>

          <p className="text-center text-sm mt-6 text-[#334155]">
            Não tem conta?{' '}
            <Link href="/cadastro" className="text-[#C2410C] font-medium hover:text-[#9A3412] transition-colors">
              Criar conta
            </Link>
          </p>
          <p className="text-center text-xs mt-3 text-[#334155]">
            Ao usar a plataforma, você concorda com a{' '}
            <Link href="/politica-de-privacidade" className="text-[#C2410C] hover:text-[#9A3412] transition-colors">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

