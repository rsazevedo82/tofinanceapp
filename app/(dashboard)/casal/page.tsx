// app/(dashboard)/casal/page.tsx
'use client'

import { useState }                                      from 'react'
import { useCouple, useSendInvite, useUnlinkCouple, useRespondInvite } from '@/hooks/useCouple'
import { useNotifications }                              from '@/hooks/useNotifications'
import type { Notification }                             from '@/types'

export default function CasalPage() {
  const { data: couple, isLoading } = useCouple()
  const { data: notifications = [] } = useNotifications()

  // Convite pendente recebido (notificação do tipo couple_invite)
  const pendingInvite = notifications.find(
    (n: Notification) => n.type === 'couple_invite' && !n.read_at
  )

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Perfil de Casal</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Conectem-se e organizem a vida financeira juntos
        </p>
      </div>

      {/* Convite pendente recebido */}
      {pendingInvite && !couple && (
        <PendingInviteCard notification={pendingInvite} />
      )}

      {/* Sem vínculo */}
      {!couple && !pendingInvite && <InviteForm />}

      {/* Vínculo ativo */}
      {couple && <CoupleStatus couple={couple} />}
    </div>
  )
}

// ── Convite pendente ──────────────────────────────────────────────────────────

function PendingInviteCard({ notification }: { notification: Notification }) {
  const respondInvite = useRespondInvite()
  const [error, setError] = useState('')

  const token = notification.payload?.token as string | undefined

  if (!token) return null

  function respond(action: 'accept' | 'reject') {
    setError('')
    respondInvite.mutate(
      { token: token!, action },
      { onError: (err) => setError(err.message) }
    )
  }

  return (
    <div className="card mb-6"
      style={{ border: '0.5px solid rgba(129,140,248,0.3)', background: 'rgba(129,140,248,0.04)' }}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">💌</span>
        <div>
          <p className="text-sm font-semibold text-[#e8e6e1]">{notification.title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{notification.body}</p>
        </div>
      </div>

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg mb-3"
          style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => respond('accept')}
          disabled={respondInvite.isPending}
          className="btn-primary text-xs flex-1 justify-center py-2.5"
          style={{ background: 'rgba(110,231,183,0.12)', borderColor: 'rgba(110,231,183,0.3)', color: '#6ee7b7' }}
        >
          {respondInvite.isPending ? 'Processando...' : 'Aceitar convite 💑'}
        </button>
        <button
          onClick={() => respond('reject')}
          disabled={respondInvite.isPending}
          className="btn-ghost text-xs px-4"
        >
          Recusar
        </button>
      </div>
    </div>
  )
}

// ── Formulário de convite ─────────────────────────────────────────────────────

function InviteForm() {
  const [email, setEmail]   = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError]   = useState('')
  const sendInvite          = useSendInvite()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    sendInvite.mutate(email, {
      onSuccess: () => { setSuccess(true); setEmail('') },
      onError:   (err) => setError(err.message),
    })
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">💑</span>
        <div>
          <p className="text-sm font-semibold text-[#e8e6e1]">Conectar com seu parceiro</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Informe o e-mail do seu parceiro para enviar um convite
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Email do parceiro</label>
          <input
            type="email"
            className="input"
            placeholder="parceiro@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={sendInvite.isPending}
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
            Convite enviado. Agora é só aguardar seu parceiro aceitar.
          </p>
        )}

        <button
          type="submit"
          className="btn-primary w-full justify-center py-2.5"
          disabled={sendInvite.isPending}
        >
          {sendInvite.isPending ? 'Enviando...' : 'Enviar convite'}
        </button>
      </form>

      <p className="text-[11px] mt-4" style={{ color: 'var(--text-muted)' }}>
        Se o email não tiver cadastro, será criada uma conta automaticamente e um e-mail de convite será enviado.
      </p>
    </div>
  )
}

// ── Status do vínculo ativo ───────────────────────────────────────────────────

function CoupleStatus({ couple }: { couple: NonNullable<ReturnType<typeof useCouple>['data']> }) {
  const [showUnlink, setShowUnlink] = useState(false)

  const linkedDate = new Date(couple.linked_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-4">
      <div className="card"
        style={{ border: '0.5px solid rgba(110,231,183,0.2)', background: 'rgba(110,231,183,0.03)' }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">💑</span>
          <div>
            <p className="text-sm font-semibold text-[#e8e6e1]">Vocês já estão conectados 🎉</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Conectado desde {linkedDate}
            </p>
          </div>
        </div>

        <div className="px-3 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
            {couple.partner?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-[#e8e6e1]">
              {couple.partner?.name ?? 'Parceiro'}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Parceiro vinculado</p>
          </div>
        </div>
      </div>

      {/* Desvincular */}
      {showUnlink ? (
        <UnlinkCoupleModal partnerName={couple.partner?.name ?? 'seu parceiro'} onCancel={() => setShowUnlink(false)} />
      ) : (
        <button
          onClick={() => setShowUnlink(true)}
          className="w-full py-2.5 rounded-xl text-sm transition-colors"
          style={{ color: 'rgba(248,113,113,0.6)', border: '0.5px solid rgba(248,113,113,0.2)' }}
        >
          Encerrar vínculo do casal
        </button>
      )}
    </div>
  )
}

// ── Modal de desvinculação ────────────────────────────────────────────────────

function UnlinkCoupleModal({ partnerName, onCancel }: { partnerName: string; onCancel: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const unlinkCouple            = useUnlinkCouple()

  function handleUnlink(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    unlinkCouple.mutate(password, {
      onError: (err) => setError(err.message),
    })
  }

  return (
    <div className="card"
      style={{ border: '0.5px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.03)' }}>
      <p className="text-sm font-semibold text-[#f87171] mb-1">Encerrar vínculo do casal</p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Ao encerrar o vínculo, vocês deixarão de compartilhar dados e objetivos. As seguintes ações serão executadas <strong className="text-[#f0ede8]">permanentemente</strong>:
      </p>

      <ul className="text-xs space-y-1.5 mb-5" style={{ color: 'rgba(252,165,165,0.7)' }}>
        <li>• Os objetivos de casal serão excluídos</li>
        <li>• A visão compartilhada dos dados será encerrada</li>
        <li>• {partnerName} será notificado</li>
        <li>• Um novo vínculo com a mesma pessoa começa do zero</li>
      </ul>

      <form onSubmit={handleUnlink} className="space-y-3">
        <div>
          <label className="label">Confirme sua senha para continuar</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={unlinkCouple.isPending}
            required
          />
        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={unlinkCouple.isPending || !password}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '0.5px solid rgba(239,68,68,0.3)' }}
          >
            {unlinkCouple.isPending ? 'Encerrando...' : 'Confirmar encerramento'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost px-4 text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
