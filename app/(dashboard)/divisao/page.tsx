// app/(dashboard)/divisao/page.tsx
'use client'

import { useState }          from 'react'
import { useCouple }         from '@/hooks/useCouple'
import { useSplits, useCreateSplit, useSettleSplit, useDeleteSplit, computeBalance } from '@/hooks/useSplits'
import { SplitForm }         from '@/components/finance/SplitForm'
import { Modal }             from '@/components/ui/Modal'
import type { ExpenseSplit } from '@/types'

type Tab = 'pending' | 'settled'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

// ── SplitCard ─────────────────────────────────────────────────────────────────

function SplitCard({
  split,
  userId,
  partnerName,
  onSettle,
  onDelete,
  settling,
  deleting,
}: {
  split:       ExpenseSplit
  userId:      string
  partnerName: string
  onSettle:    (id: string) => void
  onDelete:    (id: string) => void
  settling:    boolean
  deleting:    boolean
}) {
  const isPayer   = split.payer_id === userId
  const isPending = split.status === 'pending'

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[#f0ede8] truncate">{split.description}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {formatDate(split.date)} · Pago por {isPayer ? 'você' : partnerName}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-[#f0ede8]">{formatCurrency(split.total_amount)}</p>
          {isPending && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              pendente
            </span>
          )}
          {!isPending && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              quitado
            </span>
          )}
        </div>
      </div>

      {/* Divisão */}
      <div className="flex gap-3 text-xs">
        <div className="flex-1 rounded bg-white/5 px-3 py-2">
          <p style={{ color: 'var(--text-muted)' }}>Você ({split.payer_share_percent}%)</p>
          <p className="text-[#f0ede8] font-medium mt-0.5">{formatCurrency(split.payer_amount)}</p>
        </div>
        <div className="flex-1 rounded bg-white/5 px-3 py-2">
          <p style={{ color: 'var(--text-muted)' }}>{partnerName} ({100 - split.payer_share_percent}%)</p>
          <p className="text-[#f0ede8] font-medium mt-0.5">{formatCurrency(split.partner_amount)}</p>
        </div>
      </div>

      {!isPending && split.settled_at && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Quitado em {new Date(split.settled_at).toLocaleDateString('pt-BR')}
        </p>
      )}

      {/* Ações */}
      {isPending && (
        <div className="flex gap-2 pt-1 border-t border-white/5">
          <button
            onClick={() => onSettle(split.id)}
            disabled={settling}
            className="btn-primary text-xs flex-1 py-1.5"
          >
            {settling ? 'Quitando…' : '✓ Quitar'}
          </button>
          {isPayer && (
            <button
              onClick={() => onDelete(split.id)}
              disabled={deleting}
              className="btn-secondary text-xs px-3 py-1.5 hover:text-red-400"
              title="Remover divisão"
            >
              🗑
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── SplitBalanceCard ──────────────────────────────────────────────────────────

function SplitBalanceCard({ balance, partnerName }: { balance: number; partnerName: string }) {
  const abs = Math.abs(balance)

  if (abs < 0.01) {
    return (
      <div className="card p-5 flex items-center gap-4 mb-6">
        <span className="text-3xl">🤝</span>
        <div>
          <p className="font-semibold text-[#f0ede8]">Vocês estão quite!</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma divisão pendente no momento.</p>
        </div>
      </div>
    )
  }

  const youOwe     = balance > 0
  const label      = youOwe ? `Você deve para ${partnerName}` : `${partnerName} te deve`
  const colorClass = youOwe ? 'text-red-400' : 'text-emerald-400'

  return (
    <div className="card p-5 flex items-center gap-4 mb-6 border-l-4"
      style={{ borderLeftColor: youOwe ? '#f87171' : '#34d399' }}>
      <span className="text-3xl">{youOwe ? '💸' : '💰'}</span>
      <div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>{formatCurrency(abs)}</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DivisaoPage() {
  const [tab, setTab]           = useState<Tab>('pending')
  const [showCreate, setShowCreate] = useState(false)
  const [settlingId, setSettlingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: couple, isLoading: coupleLoading } = useCouple()
  const { data: splits = [], isLoading } = useSplits(tab)
  const { data: allPending = [] }        = useSplits('pending')

  const createSplit = useCreateSplit()
  const settleSplit = useSettleSplit()
  const deleteSplit = useDeleteSplit()

  const partnerName = couple?.partner?.name ?? 'Parceiro(a)'

  // Para calcular saldo, precisamos do userId — pegamos via payer_id do próprio split
  // Como não temos o userId diretamente no client, usamos uma heurística:
  // o saldo é calculado a partir de todos os splits pendentes
  // userId é inferido comparando payer_id dos splits
  const userId = allPending.find(s => s.payer_profile)?.payer_id ?? ''
  const balance = computeBalance(allPending, userId)

  async function handleSettle(id: string) {
    setSettlingId(id)
    try {
      await settleSplit.mutateAsync({ id, settled_at: new Date().toISOString() })
    } finally {
      setSettlingId(null)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteSplit.mutateAsync(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (coupleLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      </div>
    )
  }

  if (!couple) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 md:py-10">
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">🤝</p>
          <p className="text-[#f0ede8] font-medium mb-1">Perfil de casal não vinculado</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Vincule-se ao seu parceiro em{' '}
            <a href="/casal" className="text-indigo-400 hover:underline">Perfil Casal</a>{' '}
            para dividir despesas.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 md:py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Divisão</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Despesas compartilhadas com {partnerName}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">
          <span className="opacity-60">+</span> Nova divisão
        </button>
      </div>

      {/* Saldo */}
      <SplitBalanceCard balance={balance} partnerName={partnerName} />

      {/* Abas */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg bg-white/5 w-fit">
        {(['pending', 'settled'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-indigo-500 text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {t === 'pending' ? '⏳ Pendentes' : '✓ Histórico'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-28" />)}
        </div>
      )}

      {!isLoading && splits.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-3xl mb-2">{tab === 'pending' ? '⏳' : '📋'}</p>
          <p className="text-[#f0ede8] font-medium mb-1">
            {tab === 'pending' ? 'Nenhuma divisão pendente' : 'Nenhuma divisão quitada ainda'}
          </p>
          {tab === 'pending' && (
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm mt-3">
              Registrar primeira divisão
            </button>
          )}
        </div>
      )}

      {!isLoading && splits.length > 0 && (
        <div className="space-y-3">
          {splits.map(split => (
            <SplitCard
              key={split.id}
              split={split}
              userId={userId}
              partnerName={partnerName}
              onSettle={handleSettle}
              onDelete={handleDelete}
              settling={settlingId === split.id}
              deleting={deletingId === split.id}
            />
          ))}
        </div>
      )}

      {/* Modal criar */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nova divisão">
        <SplitForm
          couple={couple}
          onSave={async data => {
            await createSplit.mutateAsync(data)
            setShowCreate(false)
          }}
          onCancel={() => setShowCreate(false)}
          loading={createSplit.isPending}
        />
      </Modal>
    </div>
  )
}
