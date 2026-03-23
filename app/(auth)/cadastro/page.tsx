'use client'

import { useState }       from 'react'
import Image              from 'next/image'
import { createClient }   from '@/lib/supabase/client'
import { useRouter }      from 'next/navigation'

export default function CadastroPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 10) {
      setError('Senha deve ter pelo menos 10 caracteres')
      setLoading(false)
      return
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Senha deve conter letras e números')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError('Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#111110] flex">

      {/* ── Painel esquerdo — imagem (oculto em mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex flex-col items-center gap-6 px-12">
          <Image
            src="/nos-dois-reais.jpeg"
            alt="Nós Dois Reais"
            width={340}
            height={340}
            className="rounded-2xl"
            priority
          />
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold text-[#f0ede8] tracking-tight">Nós Dois Reais</p>
            <p className="text-sm" style={{ color: 'rgba(200,198,190,0.5)' }}>Sem brigas por dinheiro.</p>
            <p className="text-sm" style={{ color: 'rgba(200,198,190,0.4)' }}>Organizem a vida financeira juntos.</p>
          </div>
        </div>
        {/* Divisor vertical */}
        <div className="absolute right-0 top-0 bottom-0 w-px"
          style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          <div className="flex items-center gap-2.5 mb-10">
            <Image
              src="/nos-dois-reais.jpeg"
              alt="Nós Dois Reais"
              width={28}
              height={28}
              className="rounded-md lg:hidden"
            />
            <span className="text-base font-semibold text-[#e8e6e1] tracking-tight">
              Nós Dois Reais
            </span>
          </div>

          <h1 className="text-xl font-semibold text-[#f0ede8] tracking-tight mb-1">Criar conta</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Comece a controlar suas finanças juntos
          </p>

          <form onSubmit={handleCadastro} className="space-y-4">
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
                placeholder="mínimo 10 caracteres, letras e números"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
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
                  Criando conta...
                </span>
              ) : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'rgba(200,198,190,0.3)' }}>
            Já tem conta?{' '}
            <a href="/login"
              style={{ color: 'rgba(200,198,190,0.6)' }}
              className="hover:text-[#e8e6e1] transition-colors">
              Entrar
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
