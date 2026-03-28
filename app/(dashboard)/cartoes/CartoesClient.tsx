// app/(dashboard)/cartoes/page.tsx
'use client'

import { useMemo, useState } from 'react'
import dynamic               from 'next/dynamic'
import { useRouter }         from 'next/navigation'
import { useDeleteAccount } from '@/hooks/useAccounts'
import { useCardsOverview } from '@/hooks/useCardsOverview'
import { formatCurrency }    from '@/lib/utils/format'
import { Modal }             from '@/components/ui/Modal'
import { useCouple }         from '@/hooks/useCouple'
import { c }                 from '@/lib/utils/copy'
import { EmptyStatePanel, LoadingStatePanel } from '@/components/ui/StatePanel'
import { AlertTriangle, CreditCard } from 'lucide-react'
import type { Account, CardInvoicesSummary } from '@/types'

const AccountForm = dynamic(
  () => import('@/components/finance/AccountForm').then(m => m.AccountForm),
  { ssr: false }
)

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
      <div className="rounded-lg px-4 py-3 space-y-1 alert-box alert-box-error">
        <p className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
          <AlertTriangle size={14} aria-hidden />
          Ação irreversível
        </p>
        <p className="text-sm text-[#334155]">
          Ao excluir o cartão <strong className="text-[#0F172A]">{card.name}</strong>,
          os seguintes dados serão removidos permanentemente:
        </p>
        <ul className="text-sm space-y-0.5 mt-2 text-[#334155]">
          <li>• Todas as transações vinculadas ao cartão</li>
          <li>• Todas as faturas e parcelamentos</li>
          <li>• O cadastro do cartão</li>
        </ul>
      </div>

      {/* Senha */}
      <div>
        <label className="label">Confirme sua senha para prosseguir</label>
        <input
          type="password"
          className="input"
          placeholder="Sua senha de acesso"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          autoFocus
        />
        {error && (
          <p className="alert-box alert-box-error mt-1">
            {error}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="btn-ghost flex-1" disabled={deleteAccount.isPending}>
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={deleteAccount.isPending || !password}
          className="touch-target flex-1 px-4 rounded-lg text-sm font-medium transition-colors alert-box alert-box-error"
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
  const { data: cardsOverview = [], isLoading } = useCardsOverview()

  const [showCreate, setShowCreate]     = useState(false)
  const [editing,    setEditing]        = useState<Account | null>(null)
  const [deleting,   setDeleting]       = useState<Account | null>(null)

  const creditCards = useMemo(() => cardsOverview.map(item => item.card), [cardsOverview])

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8 md:mb-10">
        <div>
          <h1 className="page-title">Cartões</h1>
          <p className="page-subtitle mt-1">
            {creditCards.length} cartão{creditCards.length !== 1 ? 'ões' : ''} ativo{creditCards.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary w-full sm:w-auto justify-center">
          <span className="text-lg leading-none">+</span>
          Novo cartão
        </button>
      </div>

      {isLoading ? (
        <LoadingStatePanel rows={2} />
      ) : creditCards.length === 0 ? (
        <EmptyStatePanel
          icon={<CreditCard size={26} className="text-[#475569]" aria-hidden />}
          tone="cards"
          title={c(isCouple, 'Você ainda não cadastrou nenhum cartão', 'Vocês ainda não cadastraram nenhum cartão')}
          description={c(isCouple, 'Adicione seu primeiro cartão', 'Adicionem o primeiro cartão de vocês')}
          nextSteps={[
            'Cadastre limite, fechamento e vencimento para acompanhar faturas',
            'Use categorias para ver gastos de cartão nos relatórios',
          ]}
          action={(
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <span className="text-lg leading-none">+</span>
              Adicionar cartão
            </button>
          )}
        />
      ) : (
        <div className="space-y-3">
          {cardsOverview.map(({ card, summary }) => (
            <CardItem
              key={card.id}
              card={card}
              summary={summary}
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
  summary,
  onClick,
  onEdit,
  onDelete,
}: {
  card:     Account
  summary:  CardInvoicesSummary
  onClick:  () => void
  onEdit:   (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const openInvoice = summary.open_invoice
  const closedInvoice = summary.closed_invoice
  const usedAmount = Number(summary.used_amount ?? 0)

  const available   = (card.credit_limit ?? 0) - usedAmount
  const usedPercent = card.credit_limit
    ? Math.min((usedAmount / card.credit_limit) * 100, 100)
    : 0

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer transition-all duration-150 hover:border-[#D1D5DB]"
      style={{ borderColor: card.color ? `${card.color}30` : undefined }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <CreditCard size={17} className="text-[#475569]" aria-hidden />
            <p className="entity-title font-bold">{card.name}</p>
          </div>
          <p className="entity-meta">
            Fecha dia {card.closing_day} · Vence dia {card.due_day}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão excluir */}
          <button
            onClick={onDelete}
            className="touch-target text-xs px-3 rounded-lg transition-colors"
            style={{ color: '#dc2626', background: 'rgba(239,68,68,0.06)' }}
          >
            Excluir
          </button>
          {/* Botão editar */}
          <button
            onClick={onEdit}
            className="touch-target text-xs px-3 rounded-lg transition-colors"
            style={{
              color:      '#334155',
              background: 'rgba(107,114,128,0.08)',
            }}
          >
            Editar
          </button>
          <span
            className="badge-status badge-status-warning"
          >
            Ver fatura →
          </span>
        </div>
      </div>

      {/* Valores */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="data-label mb-1">Limite</p>
          <p className="text-sm font-bold text-[#0F172A]">
            {formatCurrency(card.credit_limit ?? 0)}
          </p>
        </div>
        <div>
          <p className="data-label mb-1">Fatura aberta</p>
          <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>
            {formatCurrency(Number(openInvoice?.total_amount ?? 0))}
          </p>
        </div>
        <div>
          <p className="data-label mb-1">Disponível</p>
          <p className="text-sm font-bold" style={{ color: '#2DD4BF' }}>
            {formatCurrency(available)}
          </p>
        </div>
      </div>

      {/* Barra de uso */}
      <div className="h-1.5 rounded-full overflow-hidden bg-[#E5E7EB]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width:      `${usedPercent}%`,
            background: usedPercent > 80
              ? '#ef4444'
              : usedPercent > 50
              ? '#F59E0B'
              : card.color ?? '#2DD4BF',
          }}
        />
      </div>
      <p className="meta-text mt-1.5">
        {usedPercent.toFixed(0)}% do limite utilizado
      </p>

      {/* Fatura fechada pendente */}
      {closedInvoice && (
        <div
          className="mt-3 px-3 py-2 rounded-lg flex items-center justify-between"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <p className="text-xs" style={{ color: '#d97706' }}>
            Fatura {closedInvoice.reference_month} aguardando pagamento
          </p>
          <p className="text-xs font-semibold" style={{ color: '#d97706' }}>
            {formatCurrency(Number(closedInvoice.total_amount))}
          </p>
        </div>
      )}
    </div>
  )
}

