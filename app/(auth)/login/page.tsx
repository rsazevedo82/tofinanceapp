'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou senha incorretos'); setLoading(false); return }
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

        <h1 className="text-xl font-semibold text-[#f0ede8] tracking-tight mb-1">Entrar</h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(200,198,190,0.35)' }}>
          Acesse sua conta financeira
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Senha</label>
            <input type="password" className="input" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && (
            <p className="text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>{error}</p>
          )}
          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(200,198,190,0.3)' }}>
          Não tem conta?{' '}
          <a href="/cadastro" style={{ color: 'rgba(200,198,190,0.6)' }} className="hover:text-[#e8e6e1] transition-colors">
            Criar conta
          </a>
        </p>
      </div>
    </div>
  )
}