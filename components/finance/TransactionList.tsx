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
      <p className="text-center py-12 text-sm" style={{ color: 'rgba(200,198,190,0.3)' }}>
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
              className="db-row grid gap-2 px-2"
              style={{ gridTemplateColumns: '1fr 100px 80px 90px' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-xs w-4 text-center flex-shrink-0"
                  style={{ color: t.type === 'income' ? '#6ee7b7' : '#fca5a5', opacity: 0.7 }}
                >
                  {t.type === 'income' ? '↑' : '↓'}
                </span>
                <span className="text-sm text-[#e8e6e1] truncate font-medium">
                  {t.description}
                </span>
              </div>
              <div>
                <span className="tag tag-neutral truncate max-w-full">
                  {t.category?.name ?? '—'}
                </span>
              </div>
              <div className="text-xs" style={{ color: 'rgba(200,198,190,0.35)' }}>
                {formatDate(t.date)}
              </div>
              <div className={`text-sm font-semibold text-right ${
                t.type === 'income' ? 'text-[#6ee7b7]' : 'text-[#fca5a5]'
              }`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
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
              <span className="text-xs" style={{ color: t.type === 'income' ? '#6ee7b7' : '#fca5a5' }}>
                {t.type === 'income' ? '↑' : '↓'}
              </span>
              <div>
                <p className="text-sm font-medium text-[#e8e6e1]">{t.description}</p>
                <p className="text-xs" style={{ color: 'rgba(200,198,190,0.35)' }}>
                  {t.category?.name ?? '—'} · {formatDate(t.date)}
                </p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${
              t.type === 'income' ? 'text-[#6ee7b7]' : 'text-[#fca5a5]'
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
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                confirmDelete
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-transparent text-red-400 border border-red-500/30 hover:bg-red-500/10'
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
                onClick={onDelete}
                className="w-full py-2 text-xs mt-1 transition-colors"
                style={{ color: 'rgba(200,198,190,0.35)' }}
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