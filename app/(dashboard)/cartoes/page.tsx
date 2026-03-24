// app/(dashboard)/cartoes/page.tsx
'use client'

import { useState }          from 'react'
import { useRouter }         from 'next/navigation'
import { useAccounts, useDeleteAccount } from '@/hooks/useAccounts'
import { useInvoices }       from '@/hooks/useInvoices'
import { formatCurrency }    from '@/lib/utils/format'
import { Modal }             from '@/components/ui/Modal'
import { AccountForm }       from '@/components/finance/AccountForm'
import { useCouple }         from '@/hooks/useCouple'
import { c }                 from '@/lib/utils/copy'
import type { Account }      from '@/types'

// ── Modal de exclusão com confirmação por senha ───────────────────────────────

function DeleteCardModal({
  card,
  onClose,
}: {
  card:    Account
  onClose: () => void
}) {
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState('')
  const deleteAccount = useDeleteAccount()

  async function handleConfirm() {
    setError('')
    if (!password) { setError('Informe sua senha para confirmar.'); return }

    try {
      await deleteAccount.mutateAsync({ id: card.id, password })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir cartão.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Aviso */}
      <div className="rounded-lg px-4 py-3 space-y-1"
        style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.25)' }}>
        <p className="text-sm font-medium text-red-400">⚠️ Ação irreversível</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Ao excluir o cartão <strong className="text-[#f0ede8]">{card.name}</strong>,
          os seguintes dados serão removidos permanentemente:
        </p>
        <ul className="text-sm space-y-0.5 mt-2" style={{ color: 'var(--text-muted)' }}>
          <li>• Todas as transações vinculadas ao cartão</li>
          <li>• Todas as faturas e parcelamentos</li>
          <li>• O cadastro do cartão</li>
        </ul>
      </div>

      {/* Senha */}
      <div>
        <label className="label-sm">Confirme sua senha para prosseguir</label>
        <input
          type="password"
          className="input-field"
          placeholder="Sua senha de acesso"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          autoFocus
        />
        {error && <p className="error-msg mt-1">{error}</p>}
      </div>

      {/* Ações */}
      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="btn-secondary flex-1" disabled={deleteAccount.isPending}>
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={deleteAccount.isPending || !password}
          className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171',
                   border: '0.5px solid rgba(248,113,113,0.3)' }}
        >
          {deleteAccount.isPending ? 'Excluindo…' : 'Excluir cartão'}
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CartoesPage() {
  const router                              = useRouter()
  const { data: couple }                    = useCouple()
  const isCouple                            = !!couple
  const { data: accounts = [], isLoading } = useAccounts()

  const [showCreate, setShowCreate]     = useState(false)
  const [editing,    setEditing]        = useState<Account | null>(null)
  const [deleting,   setDeleting]       = useState<Account | null>(null)

  const creditCards = accounts.filter(a => a.type === 'credit' && a.is_active)

  function handleRowClick(card: Account) {
    router.push(`/fatura/${card.id}`)
  }

  function handleEditClick(e: React.MouseEvent, card: Account) {
    e.stopPropagation()
    setEditing(card)
  }

  function handleDeleteClick(e: React.MouseEvent, card: Account) {
    e.stopPropagation()
    setDeleting(card)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Cartões</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(200,198,190,0.35)' }}>
            {creditCards.length} cartão{creditCards.length !== 1 ? 'ões' : ''} ativo{creditCards.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">
          <span className="opacity-60">+</span>
          Novo cartão
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="card animate-pulse h-32" />
          ))}
        </div>
      ) : creditCards.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-4">💳</p>
          <p className="text-sm font-medium text-[#e8e6e1] mb-1">
            {c(isCouple, 'Você ainda não cadastrou nenhum cartão', 'Vocês ainda não cadastraram nenhum cartão')}
          </p>
          <p className="text-xs mb-6" style={{ color: 'rgba(200,198,190,0.35)' }}>
            {c(isCouple, 'Adicione seu primeiro cartão', 'Adicionem o primeiro cartão de vocês')}
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs mx-auto">
            <span className="opacity-60">+</span>
            Adicionar cartão
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {creditCards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              onClick={() => handleRowClick(card)}
              onEdit={e => handleEditClick(e, card)}
              onDelete={e => handleDeleteClick(e, card)}
            />
          ))}
        </div>
      )}

      {/* Modal novo cartão */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Novo cartão">
        <AccountForm
          allowedTypes={['credit']}
          onSuccess={() => setShowCreate(false)}
        />
      </Modal>

      {/* Modal editar cartão */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar cartão">
        {editing && (
          <AccountForm
            account={editing}
            allowedTypes={['credit']}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Modal excluir cartão */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Excluir cartão">
        {deleting && (
          <DeleteCardModal
            card={deleting}
            onClose={() => setDeleting(null)}
          />
        )}
      </Modal>
    </div>
  )
}

// ── Card individual ───────────────────────────────────────────────────────────

function CardItem({
  card,
  onClick,
  onEdit,
  onDelete,
}: {
  card:     Account
  onClick:  () => void
  onEdit:   (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const { data: invoices = [] } = useInvoices(card.id)

  const openInvoice   = invoices.find(i => i.status === 'open')
  const closedInvoice = invoices.find(i => i.status === 'closed')

  const usedAmount = invoices
    .filter(i => i.status !== 'paid')
    .reduce((sum, i) => sum + Number(i.total_amount), 0)

  const available   = (card.credit_limit ?? 0) - usedAmount
  const usedPercent = card.credit_limit
    ? Math.min((usedAmount / card.credit_limit) * 100, 100)
    : 0

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer transition-all duration-150 hover:border-white/[0.12]"
      style={{ borderColor: card.color ? `${card.color}30` : undefined }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">💳</span>
            <p className="text-base font-semibold text-[#f0ede8]">{card.name}</p>
          </div>
          <p className="text-xs" style={{ color: 'rgba(200,198,190,0.35)' }}>
            Fecha dia {card.closing_day} · Vence dia {card.due_day}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão excluir */}
          <button
            onClick={onDelete}
            className="text-[10px] px-2 py-1 rounded-lg transition-colors"
            style={{ color: 'rgba(248,113,113,0.6)', background: 'rgba(248,113,113,0.06)' }}
          >
            Excluir
          </button>
          {/* Botão editar */}
          <button
            onClick={onEdit}
            className="text-[10px] px-2 py-1 rounded-lg transition-colors"
            style={{
              color:      'rgba(200,198,190,0.4)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            Editar
          </button>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ color: 'rgba(129,140,248,0.8)', background: 'rgba(129,140,248,0.1)' }}
          >
            Ver fatura →
          </span>
        </div>
      </div>

      {/* Valores */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-medium mb-1"
            style={{ color: 'rgba(200,198,190,0.35)' }}>Limite</p>
          <p className="text-sm font-semibold text-[#f0ede8]">
            {formatCurrency(card.credit_limit ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-medium mb-1"
            style={{ color: 'rgba(200,198,190,0.35)' }}>Fatura aberta</p>
          <p className="text-sm font-semibold text-[#fbbf24]">
            {formatCurrency(Number(openInvoice?.total_amount ?? 0))}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-medium mb-1"
            style={{ color: 'rgba(200,198,190,0.35)' }}>Disponivel</p>
          <p className="text-sm font-semibold text-[#6ee7b7]">
            {formatCurrency(available)}
          </p>
        </div>
      </div>

      {/* Barra de uso */}
      <div className="h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width:      `${usedPercent}%`,
            background: usedPercent > 80
              ? '#f87171'
              : usedPercent > 50
              ? '#fbbf24'
              : card.color ?? '#6ee7b7',
          }}
        />
      </div>
      <p className="text-[10px] mt-1.5" style={{ color: 'rgba(200,198,190,0.3)' }}>
        {usedPercent.toFixed(0)}% do limite utilizado
      </p>

      {/* Fatura fechada pendente */}
      {closedInvoice && (
        <div
          className="mt-3 px-3 py-2 rounded-lg flex items-center justify-between"
          style={{ background: 'rgba(251,146,60,0.08)', border: '0.5px solid rgba(251,146,60,0.2)' }}
        >
          <p className="text-xs" style={{ color: '#fb923c' }}>
            Fatura {closedInvoice.reference_month} aguardando pagamento
          </p>
          <p className="text-xs font-semibold" style={{ color: '#fb923c' }}>
            {formatCurrency(Number(closedInvoice.total_amount))}
          </p>
        </div>
      )}
    </div>
  )
}