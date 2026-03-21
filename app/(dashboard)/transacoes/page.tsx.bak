// app/(dashboard)/transacoes/page.tsx
'use client'

import { useState }            from 'react'
import { useTransactions,
         useDeleteTransaction } from '@/hooks/useTransactions'
import { useAccounts }         from '@/hooks/useAccounts'
import { formatCurrency }      from '@/lib/utils/format'
import { Modal }               from '@/components/ui/Modal'
import { TransactionForm }     from '@/components/finance/TransactionForm'
import type { Transaction }    from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  })
}

// ── Componente de linha de transacao ─────────────────────────────────────────

function TxRow({
  tx,
  accountName,
  onClick,
}: {
  tx:          Transaction
  accountName: string
  onClick:     () => void
}) {
  const isIncome = tx.type === 'income'

  return (
    <div
      onClick={onClick}
      className="db-row flex items-center justify-between px-2 py-2.5"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="text-xs w-4 text-center flex-shrink-0"
          style={{ color: isIncome ? '#6ee7b7' : '#fca5a5' }}
        >
          {isIncome ? '↑' : '↓'}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#e8e6e1] truncate">{tx.description}</p>
          <p className="text-[10px]" style={{ color: 'rgba(200,198,190,0.35)' }}>
            {accountName} · {formatDate(tx.date)}
            {tx.installment_number ? ` · Parcela ${tx.installment_number}` : ''}
          </p>
        </div>
      </div>
      <p
        className="text-sm font-semibold flex-shrink-0 ml-3"
        style={{ color: isIncome ? '#6ee7b7' : '#fca5a5' }}
      >
        {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount))}
      </p>
    </div>
  )
}

// ── Pagina principal ──────────────────────────────────────────────────────────

export default function TransacoesPage() {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  const [selectedMonth, setSelectedMonth] = useState(`${year}-${month}`)
  const [showCreate,    setShowCreate]    = useState(false)
  const [editing,       setEditing]       = useState<Transaction | null>(null)
  const [activeTab,     setActiveTab]     = useState<'expense' | 'income'>('expense')

  const start = `${selectedMonth}-01`
  const end   = new Date(
    parseInt(selectedMonth.split('-')[0]),
    parseInt(selectedMonth.split('-')[1]),
    0
  ).toISOString().split('T')[0]

  const { data: transactions = [], isLoading } = useTransactions({ start, end })
  const { data: accounts     = [] }            = useAccounts()
  const deleteTransaction                       = useDeleteTransaction()

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.name]))

  const expenses = transactions.filter(t => t.type === 'expense')
  const incomes  = transactions.filter(t => t.type === 'income')

  const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0)
  const totalIncome  = incomes.reduce((s, t)  => s + Number(t.amount), 0)

  const displayed = activeTab === 'expense' ? expenses : incomes

  // Gera lista dos ultimos 12 meses para o seletor
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const l = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value: v, label: l.charAt(0).toUpperCase() + l.slice(1) }
  })

  async function handleDelete(tx: Transaction) {
    deleteTransaction.mutate(tx.id, {
      onSuccess: () => setEditing(null),
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Transacoes</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(200,198,190,0.35)' }}>
            {transactions.length} lancamento{transactions.length !== 1 ? 's' : ''} no periodo
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Seletor de mes */}
          <select
            className="input text-xs py-1.5 px-2"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ width: 'auto' }}
          >
            {monthOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">
            <span className="opacity-60">+</span>
            Nova
          </button>
        </div>
      </div>

      {/* Resumo do mes */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card">
          <p className="label">Receitas</p>
          <p className="text-lg font-semibold" style={{ color: '#6ee7b7' }}>
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="card">
          <p className="label">Despesas</p>
          <p className="text-lg font-semibold" style={{ color: '#fca5a5' }}>
            {formatCurrency(totalExpense)}
          </p>
        </div>
        <div className="card">
          <p className="label">Saldo do periodo</p>
          <p className={`text-lg font-semibold ${
            totalIncome - totalExpense >= 0 ? 'text-[#f0ede8]' : 'text-[#fca5a5]'
          }`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Abas Receitas / Despesas */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('expense')}
          className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: activeTab === 'expense' ? 'rgba(252,165,165,0.15)' : 'transparent',
            color:      activeTab === 'expense' ? '#fca5a5' : 'rgba(200,198,190,0.4)',
          }}
        >
          ↓ Despesas ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: activeTab === 'income' ? 'rgba(110,231,183,0.15)' : 'transparent',
            color:      activeTab === 'income' ? '#6ee7b7' : 'rgba(200,198,190,0.4)',
          }}
        >
          ↑ Receitas ({incomes.length})
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-0.5">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="db-row px-2 py-3 animate-pulse">
              <div className="w-4 h-4 rounded bg-white/5" />
              <div className="ml-3 flex-1 space-y-1.5">
                <div className="h-3 bg-white/5 rounded w-48" />
                <div className="h-2 bg-white/5 rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-3xl mb-3">{activeTab === 'expense' ? '💸' : '💰'}</p>
          <p className="text-sm" style={{ color: 'rgba(200,198,190,0.35)' }}>
            Nenhuma {activeTab === 'expense' ? 'despesa' : 'receita'} neste periodo
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {displayed.map(tx => (
            <TxRow
              key={tx.id}
              tx={tx}
              accountName={accountMap[tx.account_id] ?? '—'}
              onClick={() => setEditing(tx)}
            />
          ))}
        </div>
      )}

      {/* Total da aba */}
      {displayed.length > 0 && (
        <div
          className="flex items-center justify-between px-2 py-2.5 mt-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'rgba(200,198,190,0.5)' }}>
            Total {activeTab === 'expense' ? 'de despesas' : 'de receitas'}
          </p>
          <p className="text-sm font-semibold"
            style={{ color: activeTab === 'expense' ? '#fca5a5' : '#6ee7b7' }}>
            {activeTab === 'expense' ? '-' : '+'}{formatCurrency(activeTab === 'expense' ? totalExpense : totalIncome)}
          </p>
        </div>
      )}

      {/* Modal nova transacao */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nova transacao">
        <TransactionForm onSuccess={() => setShowCreate(false)} />
      </Modal>

      {/* Modal editar transacao */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar transacao">
        {editing && (
          <div className="space-y-3">
            <TransactionForm
              transaction={editing}
              onSuccess={() => setEditing(null)}
            />
            <button
              onClick={() => handleDelete(editing)}
              disabled={deleteTransaction.isPending}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
            >
              {deleteTransaction.isPending ? 'Excluindo...' : 'Excluir transacao'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}