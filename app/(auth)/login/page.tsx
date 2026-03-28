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
          <Image
            src="/n2r-logo-completo-horizontal-cor-V1.png"
            alt="Nós 2 Reais"
            width={260}
            height={80}
            priority
          />
          <div className="text-center space-y-1.5">
            <p className="text-sm text-[#6B7280]">Sem brigas por dinheiro.</p>
            <p className="text-sm text-[#6B7280]">Organizem a vida financeira juntos.</p>
          </div>
        </div>
        {/* Divisor vertical */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-[#D1D5DB]" />
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Image
              src="/n2r-simbolo-principal-claro-V1.png"
              alt="Nós 2 Reais"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-base font-bold text-[#0F172A] tracking-tight">
              Nós 2 Reais
            </span>
          </div>

          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight mb-1">Entrar</h1>
          <p className="text-sm mb-8 text-[#6B7280]">Acesse sua conta</p>

          <form onSubmit={handleLogin} className="space-y-4">
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
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B7280] hover:text-[#0F172A] transition-colors"
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
              <Link href="/recuperar-senha" className="text-xs text-[#6B7280] hover:text-[#FF7F50] transition-colors">
                Esqueci minha senha
              </Link>
            </p>
          </form>

          <p className="text-center text-sm mt-6 text-[#6B7280]">
            Não tem conta?{' '}
            <Link href="/cadastro" className="text-[#FF7F50] font-medium hover:text-[#e86e40] transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
