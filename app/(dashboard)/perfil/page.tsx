// app/(dashboard)/perfil/page.tsx
'use client'

import { useState, useEffect }    from 'react'
import { useProfile, useUpdateProfile, useChangePassword } from '@/hooks/useProfile'

export default function PerfilPage() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-32" />)}
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="max-w-xl mx-auto px-6 py-8 md:py-10 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Meu perfil</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Gerencie seus dados pessoais e segurança
        </p>
      </div>

      {/* Avatar + identidade */}
      <div className="card flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}
        >
          {profile.name?.charAt(0).toUpperCase() ?? profile.email.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#e8e6e1] truncate">
            {profile.name ?? 'Sem nome'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {profile.email}
          </p>
        </div>
      </div>

      {/* Dados pessoais */}
      <DadosPessoaisForm profile={profile} />

      {/* Segurança */}
      <SenhaForm />
    </div>
  )
}

// ── Dados pessoais ────────────────────────────────────────────────────────────

function DadosPessoaisForm({ profile }: { profile: { name: string | null; email: string } }) {
  const [name,    setName]    = useState(profile.name ?? '')
  const [email,   setEmail]   = useState(profile.email)
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')

  const update = useUpdateProfile()

  // Sincroniza se o perfil for recarregado
  useEffect(() => {
    setName(profile.name ?? '')
    setEmail(profile.email)
  }, [profile.name, profile.email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const payload: { name?: string; email?: string } = {}
    if (name.trim()  !== (profile.name ?? '')) payload.name  = name.trim()
    if (email.trim() !== profile.email)        payload.email = email.trim()

    if (Object.keys(payload).length === 0) {
      setError('Nenhuma alteração detectada')
      return
    }

    update.mutate(payload, {
      onSuccess: () => {
        if (payload.email) {
          setSuccess('Dados salvos. Um link de confirmação foi enviado para o novo e-mail — ele só será atualizado após a confirmação.')
        } else {
          setSuccess('Dados salvos com sucesso.')
        }
      },
      onError: (err) => setError(err.message),
    })
  }

  return (
    <div className="card">
      <p className="text-sm font-semibold text-[#e8e6e1] mb-4">Dados pessoais</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Nome</label>
          <input
            type="text"
            className="input"
            placeholder="Seu nome"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={update.isPending}
          />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input
            type="email"
            className="input"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={update.isPending}
          />
        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(110,231,183,0.08)', color: '#6ee7b7' }}>
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={update.isPending}
          className="btn-primary w-full justify-center py-2.5"
        >
          {update.isPending ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}

// ── Senha ─────────────────────────────────────────────────────────────────────

function SenhaForm() {
  const [current,  setCurrent]  = useState('')
  const [next,     setNext]     = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [success,  setSuccess]  = useState('')
  const [error,    setError]    = useState('')

  const changePassword = useChangePassword()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (next !== confirm) {
      setError('A nova senha e a confirmação não coincidem')
      return
    }

    changePassword.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setSuccess('Senha alterada com sucesso.')
          setCurrent('')
          setNext('')
          setConfirm('')
        },
        onError: (err) => setError(err.message),
      }
    )
  }

  return (
    <div className="card">
      <p className="text-sm font-semibold text-[#e8e6e1] mb-4">Segurança</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Senha atual</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••••"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            disabled={changePassword.isPending}
            required
          />
        </div>
        <div>
          <label className="label">Nova senha</label>
          <input
            type="password"
            className="input"
            placeholder="mínimo 10 caracteres, letras e números"
            value={next}
            onChange={e => setNext(e.target.value)}
            disabled={changePassword.isPending}
            required
          />
        </div>
        <div>
          <label className="label">Confirmar nova senha</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••••"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            disabled={changePassword.isPending}
            required
          />
        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(110,231,183,0.08)', color: '#6ee7b7' }}>
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={changePassword.isPending || !current || !next || !confirm}
          className="btn-primary w-full justify-center py-2.5"
        >
          {changePassword.isPending ? 'Alterando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  )
}

