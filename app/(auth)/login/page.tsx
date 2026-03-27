'use client'

import { useState }       from 'react'
import Image              from 'next/image'
import { createClient }   from '@/lib/supabase/client'
import { useRouter }      from 'next/navigation'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha incorretos')
      setLoading(false)
      return
    }
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
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
              />
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
          </form>

          <p className="text-center text-sm mt-6 text-[#6B7280]">
            Não tem conta?{' '}
            <a href="/cadastro" className="text-[#FF7F50] font-medium hover:text-[#e86e40] transition-colors">
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
