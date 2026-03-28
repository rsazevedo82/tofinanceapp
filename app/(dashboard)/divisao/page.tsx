// app/(dashboard)/divisao/page.tsx
'use client'

import { useState }          from 'react'
import dynamic               from 'next/dynamic'
import Link                  from 'next/link'
import { useCouple }         from '@/hooks/useCouple'
import { useSplits, useCreateSplit, useSettleSplit, useDeleteSplit, computeBalance } from '@/hooks/useSplits'
import { Modal }             from '@/components/ui/Modal'
import type { ExpenseSplit } from '@/types'

const SplitForm = dynamic(
  () => import('@/components/finance/SplitForm').then(m => m.SplitForm),
  { ssr: false }
)

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
          <p className="font-semibold text-[#0F172A] truncate">{split.description}</p>
          <p className="text-xs mt-0.5 text-[#6B7280]">
            {formatDate(split.date)} · Pago por {isPayer ? 'você' : partnerName}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-[#0F172A]">{formatCurrency(split.total_amount)}</p>
          {isPending ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
              pendente
            </span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#CCFBF1] text-[#0d9488] border border-teal-100">
              quitado
            </span>
          )}
        </div>
      </div>

      {/* Divisão */}
      <div className="flex gap-3 text-xs">
        <div className="flex-1 rounded bg-[#F3F4F6] px-3 py-2">
          <p className="text-[#6B7280]">Você ({split.payer_share_percent}%)</p>
          <p className="text-[#0F172A] font-semibold mt-0.5">{formatCurrency(split.payer_amount)}</p>
        </div>
        <div className="flex-1 rounded bg-[#F3F4F6] px-3 py-2">
          <p className="text-[#6B7280]">{partnerName} ({100 - split.payer_share_percent}%)</p>
          <p className="text-[#0F172A] font-semibold mt-0.5">{formatCurrency(split.partner_amount)}</p>
        </div>
      </div>

      {!isPending && split.settled_at && (
        <p className="text-xs text-[#6B7280]">
          Quitado em {new Date(split.settled_at).toLocaleDateString('pt-BR')}
        </p>
      )}

      {/* Ações */}
      {isPending && (
        <div className="flex gap-2 pt-1 border-t border-[#D1D5DB]">
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
              className="btn-ghost text-xs px-3 py-1.5 hover:text-red-500"
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
          <p className="font-semibold text-[#0F172A]">Tudo certo entre vocês 👍</p>
          <p className="text-sm text-[#6B7280]">Nenhum valor pendente entre vocês</p>
        </div>
      </div>
    )
  }

  const youOwe     = balance > 0
  const label      = youOwe ? `Você tem um valor pendente com ${partnerName}` : `${partnerName} tem um valor pendente com você`
  const colorClass = youOwe ? 'text-red-500' : 'text-[#2DD4BF]'

  return (
    <div className="card p-5 flex items-center gap-4 mb-6 border-l-4"
      style={{ borderLeftColor: youOwe ? '#ef4444' : '#2DD4BF' }}>
      <span className="text-3xl">{youOwe ? '💸' : '💰'}</span>
      <div>
        <p className="text-sm text-[#6B7280]">{label}</p>
        <p className={`text-2xl font-black ${colorClass}`}>{formatCurrency(abs)}</p>
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
      <div className="max-w-2xl mx-auto px-6 py-10 md:py-12">
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">🤝</p>
          <p className="text-[#0F172A] font-semibold mb-1">Perfil de casal não vinculado</p>
          <p className="text-sm mb-4 text-[#6B7280]">
            Vincule-se ao seu parceiro em{' '}
            <Link href="/casal" className="text-[#FF7F50] hover:underline font-medium">Conexão do casal</Link>{' '}
            para dividir despesas.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 md:py-12">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Divisão</h1>
          <p className="text-sm mt-1 text-[#6B7280]">
            Despesas compartilhadas com {partnerName}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <span className="text-lg leading-none">+</span> Nova divisão
        </button>
      </div>

      {/* Saldo */}
      <SplitBalanceCard balance={balance} partnerName={partnerName} />

      {/* Abas */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg bg-[#F3F4F6] w-fit">
        {(['pending', 'settled'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              tab === t
                ? 'bg-[#FF7F50] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#0F172A]'
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
          <p className="text-[#0F172A] font-semibold mb-1">
            {tab === 'pending' ? 'Nenhuma divisão pendente' : 'Nenhuma divisão quitada ainda'}
          </p>
          {tab === 'pending' && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-3">
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
