// app/(dashboard)/casal/page.tsx
'use client'

import { useState }                                      from 'react'
import {
  useCouple, useSendInvite, useUnlinkCouple,
  useRespondInvite, usePendingInvite, useReceivedInvite,
  useResendInvite, useCancelInvite,
} from '@/hooks/useCouple'
import type { ReceivedCoupleInvite } from '@/hooks/useCouple'
import type { CoupleInvitation } from '@/types'

export default function CasalPage() {
  const { data: couple,      isLoading: loadingCouple }  = useCouple()
  const { data: sentInvite,  isLoading: loadingSent }    = usePendingInvite()
  const { data: receivedInvite, isLoading: loadingReceived } = useReceivedInvite()

  const isLoading = loadingCouple || loadingSent || loadingReceived

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
    <div className="max-w-2xl mx-auto px-6 py-10 md:py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Perfil de Casal</h1>
        <p className="text-sm mt-1 text-[#6B7280]">
          Conectem-se e organizem a vida financeira juntos
        </p>
      </div>

      {/* 1. Convite recebido aguardando resposta */}
      {receivedInvite && !couple && (
        <PendingInviteCard invite={receivedInvite} />
      )}

      {/* 2. Convite enviado aguardando resposta do parceiro */}
      {sentInvite && !couple && !receivedInvite && (
        <SentInviteCard invitation={sentInvite} />
      )}

      {/* 3. Sem vínculo e sem convites */}
      {!couple && !receivedInvite && !sentInvite && <InviteForm />}

      {/* 4. Vínculo ativo */}
      {couple && <CoupleStatus couple={couple} />}
    </div>
  )
}

// ── Convite pendente ──────────────────────────────────────────────────────────

function PendingInviteCard({ invite }: { invite: ReceivedCoupleInvite }) {
  const respondInvite = useRespondInvite()
  const [error, setError] = useState('')

  const token = invite.invitation.token

  const inviterName = invite.inviter_name || 'Seu parceiro'

  function respond(action: 'accept' | 'reject') {
    setError('')
    respondInvite.mutate(
      { token, action },
      { onError: (err) => setError(err.message) }
    )
  }

  return (
    <div className="card mb-6"
      style={{ border: '2px solid rgba(255,127,80,0.45)', background: 'rgba(255,127,80,0.08)' }}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">💌</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#EA580C]">Ação necessária</p>
          <p className="text-sm font-bold text-[#0F172A]">Você recebeu um convite de perfil compartilhado</p>
          <p className="text-xs mt-0.5 text-[#6B7280]">
            {inviterName} convidou você para conectar as finanças.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded-lg mb-3 bg-red-50 border border-red-100 text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => respond('accept')}
          disabled={respondInvite.isPending}
          className="btn-primary text-xs flex-1 justify-center py-2.5"
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

// ── Convite enviado aguardando resposta ───────────────────────────────────────

function SentInviteCard({ invitation }: { invitation: CoupleInvitation }) {
  const resendInvite = useResendInvite()
  const cancelInvite = useCancelInvite()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isExpired  = new Date(invitation.expires_at) < new Date()
  const expiryDate = new Date(invitation.expires_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const isBusy = resendInvite.isPending || cancelInvite.isPending

  function handleResend() {
    setFeedback(null)
    resendInvite.mutate(undefined, {
      onSuccess: () => setFeedback({ type: 'success', message: 'Convite reenviado com sucesso!' }),
      onError:   (err) => setFeedback({ type: 'error', message: err.message }),
    })
  }

  function handleCancel() {
    setFeedback(null)
    cancelInvite.mutate(undefined, {
      onError: (err) => setFeedback({ type: 'error', message: err.message }),
    })
  }

  return (
    <div className="card mb-6"
      style={{ border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>

      {/* Cabeçalho */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">📨</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0F172A]">Convite enviado</p>
          <p className="text-xs mt-0.5 truncate text-[#6B7280]">
            Aguardando {invitation.invitee_email} aceitar o convite
          </p>
        </div>
      </div>

      {/* Detalhe de expiração */}
      <div className="px-3 py-2.5 rounded-lg mb-4 flex items-center gap-2"
        style={{
          background: isExpired ? 'rgba(239,68,68,0.06)' : '#F3F4F6',
          border:     isExpired ? '1px solid rgba(239,68,68,0.15)' : '1px solid #D1D5DB',
        }}>
        <span className="text-xs" style={{ color: isExpired ? '#dc2626' : '#6B7280' }}>
          {isExpired ? '⚠️ Expirado em' : '⏱ Expira em'}
        </span>
        <span className="text-xs font-semibold" style={{ color: isExpired ? '#dc2626' : '#0F172A' }}>
          {expiryDate}
        </span>
        {isExpired && (
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600">
            Reenvie para renovar
          </span>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <p className="text-sm px-3 py-2 rounded-lg mb-3 border"
          style={{
            background: feedback.type === 'success' ? 'rgba(45,212,191,0.08)' : 'rgba(239,68,68,0.06)',
            borderColor: feedback.type === 'success' ? 'rgba(45,212,191,0.2)' : 'rgba(239,68,68,0.15)',
            color: feedback.type === 'success' ? '#0d9488' : '#dc2626',
          }}>
          {feedback.message}
        </p>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={handleResend}
          disabled={isBusy}
          className="btn-primary text-xs flex-1 justify-center py-2.5"
          style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}
        >
          {resendInvite.isPending ? 'Reenviando...' : 'Reenviar convite'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isBusy}
          className="btn-ghost text-xs px-4"
        >
          {cancelInvite.isPending ? 'Cancelando...' : 'Cancelar'}
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
          <p className="text-sm font-bold text-[#0F172A]">Conectar com seu parceiro</p>
          <p className="text-xs mt-0.5 text-[#6B7280]">
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
          <p className="text-sm px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm px-3 py-2 rounded-lg border"
            style={{ background: 'rgba(45,212,191,0.08)', borderColor: 'rgba(45,212,191,0.2)', color: '#0d9488' }}>
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

      <p className="text-xs mt-4 text-[#6B7280]">
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
        style={{ border: '1px solid rgba(45,212,191,0.25)', background: 'rgba(45,212,191,0.03)' }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">💑</span>
          <div>
            <p className="text-sm font-bold text-[#0F172A]">Vocês já estão conectados 🎉</p>
            <p className="text-xs mt-0.5 text-[#6B7280]">
              Conectado desde {linkedDate}
            </p>
          </div>
        </div>

        <div className="px-3 py-3 rounded-xl flex items-center gap-3 bg-[#F3F4F6]"
          style={{ border: '1px solid #D1D5DB' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
            style={{ background: 'rgba(255,127,80,0.12)', color: '#FF7F50' }}>
            {couple.partner?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">
              {couple.partner?.name ?? 'Parceiro'}
            </p>
            <p className="text-xs text-[#6B7280]">Parceiro vinculado</p>
          </div>
        </div>
      </div>

      {/* Desvincular */}
      {showUnlink ? (
        <UnlinkCoupleModal partnerName={couple.partner?.name ?? 'seu parceiro'} onCancel={() => setShowUnlink(false)} />
      ) : (
        <button
          onClick={() => setShowUnlink(true)}
          className="touch-target w-full rounded-xl text-sm transition-colors text-red-500 border border-red-100 hover:bg-red-50"
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
      style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
      <p className="text-sm font-bold text-red-600 mb-1">Encerrar vínculo do casal</p>
      <p className="text-xs mb-4 text-[#6B7280]">
        Ao encerrar o vínculo, vocês deixarão de compartilhar dados e objetivos. As seguintes ações serão executadas <strong className="text-[#0F172A]">permanentemente</strong>:
      </p>

      <ul className="text-xs space-y-1.5 mb-5 text-red-500">
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
          <p className="text-sm px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={unlinkCouple.isPending || !password}
            className="touch-target flex-1 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}
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
