'use client'

import { useState }       from 'react'
import Image              from 'next/image'
import Link               from 'next/link'
import { createClient }   from '@/lib/supabase/client'
import { useRouter }      from 'next/navigation'
import { useToast }       from '@/components/providers/ToastProvider'

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (!password) return { label: 'Digite sua senha', color: '#D1D5DB', width: '0%' }

  const hasMinLength = password.length >= 10
  const hasLetters = /[a-zA-Z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)

  const checks = [hasMinLength, hasLetters, hasNumbers].filter(Boolean).length

  if (checks <= 1) {
    return { label: 'Senha fraca', color: '#EF4444', width: '33%' }
  }
  if (checks === 2) {
    return { label: 'Senha média', color: '#F59E0B', width: '66%' }
  }
  return { label: 'Senha boa', color: '#22C55E', width: '100%' }
}

export default function CadastroPage() {
  const emailInputId = 'signup-email'
  const passwordInputId = 'signup-password'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()
  const { showToast } = useToast()
  const strength = getPasswordStrength(password)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password.length < 10) {
      const message = 'Senha deve ter pelo menos 10 caracteres'
      setError(message)
      showToast({ title: 'Dados inválidos', description: message, variant: 'error' })
      setLoading(false)
      return
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      const message = 'Senha deve conter letras e números'
      setError(message)
      showToast({ title: 'Dados inválidos', description: message, variant: 'error' })
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json: {
      data: { session: { access_token: string; refresh_token: string } | null } | null
      error: string | null
    } = await res.json()

    if (!res.ok || json.error || !json.data) {
      const message = json.error ?? 'Nao foi possivel criar a conta.'
      setError(message)
      showToast({ title: 'Falha no cadastro', description: message, variant: 'error' })
      setLoading(false)
      return
    }

    if (!json.data.session) {
      const message = 'Conta criada. Confirme seu e-mail antes de entrar.'
      setSuccess(message)
      showToast({ title: 'Conta criada', description: message, variant: 'success' })
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: json.data.session.access_token,
      refresh_token: json.data.session.refresh_token,
    })
    if (sessionError) {
      const message = 'Conta criada, mas houve falha ao iniciar sessao. Faca login manualmente.'
      setError(message)
      showToast({ title: 'Cadastro concluído com alerta', description: message, variant: 'info' })
      setLoading(false)
      return
    }

    showToast({ title: 'Conta criada com sucesso', variant: 'success' })
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

          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight mb-1">Criar conta</h1>
          <p className="text-sm mb-8 text-[#6B7280]">Comece a organizar sua vida financeira</p>

          <form onSubmit={handleCadastro} className="space-y-4">
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
                  placeholder="mínimo 10 caracteres, letras e números"
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
              <div className="mt-2">
                <div className="h-1.5 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: strength.width, backgroundColor: strength.color }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: strength.color }}>
                  {strength.label}
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm px-3 py-2 rounded-lg bg-green-50 border border-green-100 text-green-700">
                {success}
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
                  Criando conta...
                </span>
              ) : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm mt-6 text-[#6B7280]">
            Já tem conta?{' '}
            <Link href="/login" className="text-[#FF7F50] font-medium hover:text-[#e86e40] transition-colors">
              Entrar
            </Link>
          </p>
          <p className="text-center text-xs mt-3 text-[#6B7280]">
            Ao criar a conta, você concorda com a{' '}
            <Link href="/politica-de-privacidade" className="text-[#FF7F50] hover:text-[#e86e40] transition-colors">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
