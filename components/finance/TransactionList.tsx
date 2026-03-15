'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Modal } from '@/components/ui/Modal'
import { EditTransactionForm } from '@/components/finance/EditTransactionForm'
import type { Transaction } from '@/types'

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [editing, setEditing] = useState<Transaction | null>(null)

  if (transactions.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-8">
        Nenhuma transação este mês
      </p>
    )
  }

  return (
    <>
      <div className="space-y-1">
        {transactions.map((t) => (
          <div
            key={t.id}
            onClick={() => setEditing(t)}
            className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                style={{ backgroundColor: (t.category?.color ?? '#6B7280') + '20' }}
              >
                {t.type === 'income' ? '↑' : '↓'}
              </div>
              <div>
                <p className="text-slate-200 text-sm font-medium">{t.description}</p>
                <p className="text-slate-500 text-xs">
                  {t.category?.name ?? 'Sem categoria'} · {formatDate(t.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${
                t.type === 'income' ? 'text-green-400' : 'text-red-400'
              }`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
              <span className="text-slate-600 group-hover:text-slate-400 transition-colors text-xs">
                ✎
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Editar transação"
      >
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