// components/finance/TransactionList.tsx
'use client'

import { useState }           from 'react'
import { formatCurrency }     from '@/lib/utils/format'
import { Modal }              from '@/components/ui/Modal'
import { TransactionForm }    from '@/components/finance/TransactionForm'
import { useDeleteTransaction } from '@/hooks/useTransactions'
import type { Transaction }   from '@/types'

interface Props {
  transactions: Transaction[]
  layout?:      'default' | 'database'
}

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  })
}

export function TransactionList({ transactions, layout = 'default' }: Props) {
  const [editing, setEditing]         = useState<Transaction | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTransaction             = useDeleteTransaction()

  function handleClose() {
    setEditing(null)
    setConfirmDelete(false)
  }

  function handleDelete() {
    if (!editing) return
    if (!confirmDelete) { setConfirmDelete(true); return }

    deleteTransaction.mutate(editing.id, {
      onSuccess: () => handleClose(),
    })
  }

  if (transactions.length === 0) {
    return (
      <p className="text-center py-12 text-sm text-[#6B7280]">
        Nenhuma transacao neste periodo
      </p>
    )
  }

  // ── Layout database (tabela estilo Notion) ────────────────────────────────

  if (layout === 'database') {
    return (
      <>
        <div className="space-y-0.5">
          {transactions.map((t) => (
            <div
              key={t.id}
              onClick={() => { setEditing(t); setConfirmDelete(false) }}
              className="db-row px-2 py-2.5"
            >
              <div className="flex flex-col gap-1.5 md:grid md:items-center md:gap-3 md:[grid-template-columns:minmax(0,1.6fr)_minmax(120px,1fr)_minmax(88px,auto)_minmax(120px,auto)]">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-xs w-4 text-center flex-shrink-0"
                    style={{ color: t.type === 'income' ? '#2DD4BF' : '#FF7F50', opacity: 0.7 }}
                  >
                    {t.type === 'income' ? '↑' : '↓'}
                  </span>
                  <span className="text-sm text-[#0F172A] truncate font-medium">
                    {t.description}
                  </span>
                </div>

                <div>
                  <span className="tag tag-neutral truncate max-w-full">
                    {t.category?.name ?? '—'}
                  </span>
                </div>

                <div className="text-xs text-[#6B7280]">
                  {formatDate(t.date)}
                </div>

                <div className={`text-sm font-semibold md:text-right ${
                  t.type === 'income' ? 'text-[#2DD4BF]' : 'text-[#FF7F50]'
                }`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <EditModal
          editing={editing}
          confirmDelete={confirmDelete}
          onClose={handleClose}
          onDelete={handleDelete}
          isPending={deleteTransaction.isPending}
        />
      </>
    )
  }

  // ── Layout default ────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-0.5">
        {transactions.map((t) => (
          <div
            key={t.id}
            onClick={() => { setEditing(t); setConfirmDelete(false) }}
            className="db-row flex items-center justify-between px-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: t.type === 'income' ? '#2DD4BF' : '#FF7F50' }}>
                {t.type === 'income' ? '↑' : '↓'}
              </span>
              <div>
                <p className="text-sm font-medium text-[#0F172A]">{t.description}</p>
                <p className="text-xs text-[#6B7280]">
                  {t.category?.name ?? '—'} · {formatDate(t.date)}
                </p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${
              t.type === 'income' ? 'text-[#2DD4BF]' : 'text-[#FF7F50]'
            }`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </span>
          </div>
        ))}
      </div>

      <EditModal
        editing={editing}
        confirmDelete={confirmDelete}
        onClose={handleClose}
        onDelete={handleDelete}
        isPending={deleteTransaction.isPending}
      />
    </>
  )
}

// ── Modal de edicao reutilizavel ──────────────────────────────────────────────

function EditModal({
  editing,
  confirmDelete,
  onClose,
  onDelete,
  isPending,
}: {
  editing:       Transaction | null
  confirmDelete: boolean
  onClose:       () => void
  onDelete:      () => void
  isPending:     boolean
}) {
  return (
    <Modal isOpen={!!editing} onClose={onClose} title="Editar transacao">
      {editing && (
        <div className="space-y-3">
          <TransactionForm
            transaction={editing}
            onSuccess={onClose}
          />

          {/* Botao de exclusao separado do formulario */}
          <div style={{ borderTop: '1px solid #D1D5DB', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className={`touch-target w-full rounded-xl text-sm font-medium transition-colors ${
                confirmDelete
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-transparent text-red-500 border border-red-200 hover:bg-red-50'
              }`}
            >
              {isPending
                ? 'Excluindo...'
                : confirmDelete
                ? 'Confirmar exclusao'
                : 'Excluir transacao'}
            </button>

            {confirmDelete && (
              <button
                type="button"
                onClick={onClose}
                className="touch-target w-full text-xs mt-1 text-[#6B7280] hover:text-[#0F172A] transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
