import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Transaction } from '@/types'

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-8">
        Nenhuma transação este mês
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((t) => (
        <div key={t.id} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
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
          <span className={`text-sm font-semibold ${
            t.type === 'income' ? 'text-green-400' : 'text-red-400'
          }`}>
            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}