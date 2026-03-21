'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CadastroPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    if (password.length < 10) { setError('Senha deve ter pelo menos 10 caracteres'); setLoading(false); return }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) { setError('Senha deve conter letras e números'); setLoading(false); return }
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError('Erro ao criar conta. Tente novamente.'); setLoading(false); return }
    router.push('/'); router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#111110] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#e8e6e1' }}>F</div>
          <span className="text-base font-semibold text-[#e8e6e1] tracking-tight">FinanceApp</span>
        </div>

        <h1 className="text-xl font-semibold text-[#f0ede8] tracking-tight mb-1">Criar conta</h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(200,198,190,0.35)' }}>
          Comece a controlar suas finanças
        </p>

        <form onSubmit={handleCadastro} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Senha</label>
            <input type="password" className="input" placeholder="mínimo 10 caracteres, letras e números"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && (
            <p className="text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>{error}</p>
          )}
          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(200,198,190,0.3)' }}>
          Já tem conta?{' '}
          <a href="/login" style={{ color: 'rgba(200,198,190,0.6)' }} className="hover:text-[#e8e6e1] transition-colors">
            Entrar
          </a>
        </p>
      </div>
    </div>
  )
}