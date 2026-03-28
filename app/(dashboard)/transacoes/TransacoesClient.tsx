// app/(dashboard)/transacoes/page.tsx
'use client'

import { useState } from 'react'
import { useTransactions,
         useDeleteTransaction }         from '@/hooks/useTransactions'
import { useAccounts }                  from '@/hooks/useAccounts'
import { formatCurrency }               from '@/lib/utils/format'
import { Modal }                        from '@/components/ui/Modal'
import { TransactionForm }              from '@/components/finance/TransactionForm'
import { useCouple }                    from '@/hooks/useCouple'
import { c }                            from '@/lib/utils/copy'
import { useToast }                     from '@/components/providers/ToastProvider'
import type { Transaction }             from '@/types'

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ── Select customizado inline ─────────────────────────────────────────────────

function MonthSelect({
  value,
  onChange,
  options,
}: {
  value:    string
  onChange: (v: string) => void
  options:  { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="input w-full sm:w-auto min-h-[44px] h-11 text-sm px-3 text-[#0F172A]"
      style={{ minWidth: '140px' }}
      aria-label="Selecionar mês"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// ── Linha de transacao ────────────────────────────────────────────────────────

function TxRow({ tx, accountName, onClick }: {
  tx: Transaction; accountName: string; onClick: () => void
}) {
  const isIncome = tx.type === 'income'
  return (
    <div onClick={onClick} className="db-row flex items-center justify-between px-2 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs w-4 text-center flex-shrink-0"
          style={{ color: isIncome ? '#2DD4BF' : '#FF7F50' }}>
          {isIncome ? '↑' : '↓'}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#0F172A] truncate">{tx.description}</p>
          <p className="text-xs text-[#475569]">
            {accountName} · {formatDate(tx.date)}
            {tx.installment_number ? ` · Parcela ${tx.installment_number}` : ''}
          </p>
        </div>
      </div>
      <p className="text-sm font-semibold flex-shrink-0 ml-3"
        style={{ color: isIncome ? '#2DD4BF' : '#FF7F50' }}>
        {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount))}
      </p>
    </div>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function TransacoesPage() {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  const [selectedMonth, setSelectedMonth] = useState(`${year}-${month}`)
  const [showCreate,    setShowCreate]    = useState(false)
  const [editing,       setEditing]       = useState<Transaction | null>(null)
  const [activeTab,     setActiveTab]     = useState<'expense' | 'income'>('expense')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const start = `${selectedMonth}-01`
  const end   = new Date(
    parseInt(selectedMonth.split('-')[0]),
    parseInt(selectedMonth.split('-')[1]),
    0
  ).toISOString().split('T')[0]

  const { data: couple }                       = useCouple()
  const { showToast }                          = useToast()
  const isCouple                               = !!couple
  const { data: transactions = [], isLoading } = useTransactions({ start, end })
  const { data: accounts     = [] }            = useAccounts()
  const deleteTransaction                       = useDeleteTransaction()

  const accountMap   = Object.fromEntries(accounts.map(a => [a.id, a.name]))
  const expenses     = transactions.filter(t => t.type === 'expense')
  const incomes      = transactions.filter(t => t.type === 'income')
  const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0)
  const totalIncome  = incomes.reduce((s, t)  => s + Number(t.amount), 0)
  const displayed    = activeTab === 'expense' ? expenses : incomes

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const l = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value: v, label: l.charAt(0).toUpperCase() + l.slice(1) }
  })

  function handleDelete() {
    if (!editing) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteTransaction.mutate(editing.id, {
      onSuccess: () => {
        showToast({ title: 'Transação excluída', variant: 'success' })
        setEditing(null)
        setConfirmDelete(false)
      },
      onError: (err) => {
        showToast({
          title: 'Falha ao excluir',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          variant: 'error',
        })
      },
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">

      <div className="flex flex-col gap-4 mb-7 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight">
            {c(isCouple, 'Seus gastos', 'Gastos de vocês')}
          </h1>
          <p className="text-sm mt-1 text-[#475569]">
            {transactions.length} movimentação{transactions.length !== 1 ? 'ões' : ''} no período
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <MonthSelect value={selectedMonth} onChange={setSelectedMonth} options={monthOptions} />
          <button onClick={() => setShowCreate(true)} className="btn-primary w-full sm:w-auto">
            <span className="text-lg leading-none">+</span>
            Registrar gasto
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 md:mb-8">
        <div className="card">
          <p className="label">Receitas</p>
          <p className="text-base sm:text-lg font-bold" style={{ color: '#2DD4BF' }}>
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="card">
          <p className="label">Despesas</p>
          <p className="text-base sm:text-lg font-bold" style={{ color: '#FF7F50' }}>
            {formatCurrency(totalExpense)}
          </p>
        </div>
        <div className="card">
          <p className="label">Saldo</p>
          <p className={`text-base sm:text-lg font-bold ${
            totalIncome - totalExpense >= 0 ? 'text-[#0F172A]' : 'text-[#FF7F50]'
          }`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-white"
        style={{ border: '1px solid #D1D5DB', width: 'fit-content' }}>
        {([
          { key: 'expense', label: `↓ Despesas (${expenses.length})`, color: '#FF7F50', bg: 'rgba(255,127,80,0.1)' },
          { key: 'income',  label: `↑ Receitas (${incomes.length})`,  color: '#2DD4BF', bg: 'rgba(45,212,191,0.1)' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.key ? tab.bg    : 'transparent',
              color:      activeTab === tab.key ? tab.color : '#475569',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-0.5">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="db-row px-2 py-3 animate-pulse">
              <div className="w-4 h-4 rounded bg-[#E5E7EB] mr-3" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-[#E5E7EB] rounded w-48" />
                <div className="h-2 bg-[#E5E7EB] rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-3xl mb-3">{activeTab === 'expense' ? '💸' : '💰'}</p>
          <p className="text-sm text-[#475569]">
            {activeTab === 'expense'
              ? c(isCouple, 'Nenhuma despesa registrada neste período', 'Nenhuma despesa registrada por vocês neste período')
              : c(isCouple, 'Nenhuma receita registrada neste período', 'Nenhuma receita registrada por vocês neste período')}
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {displayed.map(tx => (
            <TxRow
              key={tx.id}
              tx={tx}
              accountName={accountMap[tx.account_id] ?? '—'}
              onClick={() => { setEditing(tx); setConfirmDelete(false) }}
            />
          ))}
        </div>
      )}

      {/* Total */}
      {displayed.length > 0 && (
        <div className="flex items-center justify-between px-2 py-2.5 mt-2 rounded-lg bg-white"
          style={{ border: '1px solid #D1D5DB' }}>
          <p className="text-xs font-medium text-[#475569]">
            Total {activeTab === 'expense' ? 'de despesas' : 'de receitas'}
          </p>
          <p className="text-sm font-semibold"
            style={{ color: activeTab === 'expense' ? '#FF7F50' : '#2DD4BF' }}>
            {activeTab === 'expense' ? '-' : '+'}{formatCurrency(activeTab === 'expense' ? totalExpense : totalIncome)}
          </p>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nova transação">
        <TransactionForm onSuccess={() => setShowCreate(false)} />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => { setEditing(null); setConfirmDelete(false) }} title="Editar transação">
        {editing && (
          <div className="space-y-3">
            <TransactionForm transaction={editing} onSuccess={() => setEditing(null)} />
            <div style={{ borderTop: '1px solid #D1D5DB', paddingTop: 12 }}>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteTransaction.isPending}
                className={`touch-target w-full rounded-xl text-sm font-medium transition-colors ${
                  confirmDelete
                    ? 'bg-red-500 text-white'
                    : 'bg-transparent text-red-500 border border-red-200 hover:bg-red-50'
                }`}
              >
                {deleteTransaction.isPending ? 'Excluindo...' : confirmDelete ? 'Confirmar exclusão' : 'Excluir transação'}
              </button>
              {confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="touch-target w-full text-xs mt-1 text-[#475569]"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
