'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Modal } from '@/components/ui/Modal'
import { EditTransactionForm } from '@/components/finance/EditTransactionForm'
import type { Transaction } from '@/types'

interface Props {
  transactions: Transaction[]
  layout?: 'default' | 'database'
}

export function TransactionList({ transactions, layout = 'default' }: Props) {
  const [editing, setEditing] = useState<Transaction | null>(null)

  if (transactions.length === 0) {
    return (
      <p className="text-center py-12 text-sm" style={{ color: 'rgba(200,198,190,0.3)' }}>
        Nenhuma transação este mês
      </p>
    )
  }

  if (layout === 'database') {
    return (
      <>
        <div className="space-y-0.5">
          {transactions.map((t) => (
            <div
              key={t.id}
              onClick={() => setEditing(t)}
              className="db-row grid gap-2 px-2"
              style={{ gridTemplateColumns: '1fr 100px 80px 90px' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs w-4 text-center flex-shrink-0"
                  style={{ color: t.type === 'income' ? '#6ee7b7' : '#fca5a5', opacity: 0.7 }}>
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

        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar transação">
          {editing && (
            <EditTransactionForm
              transaction={editing}
              onSuccess={() => setEditing(null)}
              onDelete={() => setEditing(null)}
            />
          )}
        </Modal>
      </>
    )
  }

  return (
    <>
      <div className="space-y-0.5">
        {transactions.map((t) => (
          <div key={t.id} onClick={() => setEditing(t)}
            className="db-row flex items-center justify-between px-2">
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

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar transação">
        {editing && (
          <EditTransactionForm
            transaction={editing}
            onSuccess={() => setEditing(null)}
            onDelete={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  )
}