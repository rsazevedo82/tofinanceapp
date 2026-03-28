// app/(dashboard)/transacoes/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic      from 'next/dynamic'
import { useInfiniteTransactions,
         useDeleteTransaction }         from '@/hooks/useTransactions'
import { useAccounts }                  from '@/hooks/useAccounts'
import { formatCurrency }               from '@/lib/utils/format'
import { Modal }                        from '@/components/ui/Modal'
import { useCouple }                    from '@/hooks/useCouple'
import { c }                            from '@/lib/utils/copy'
import { useToast }                     from '@/components/providers/ToastProvider'
import { useVirtualizer }               from '@tanstack/react-virtual'
import { EmptyStatePanel, LoadingStatePanel } from '@/components/ui/StatePanel'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import type { Transaction }             from '@/types'

const TransactionForm = dynamic(
  () => import('@/components/finance/TransactionForm').then(m => m.TransactionForm),
  { ssr: false }
)

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
    <button
      type="button"
      onClick={onClick}
      className="db-row flex w-full items-center justify-between px-2 py-2.5 text-left"
      aria-label={`Abrir transação ${tx.description}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className="w-4 flex-shrink-0 text-center text-xs"
          style={{ color: isIncome ? '#2DD4BF' : '#FF7F50' }}
        >
          {isIncome ? '↑' : '↓'}
        </span>
        <span className="min-w-0">
          <span className="block truncate entity-title">{tx.description}</span>
          <span className="block entity-meta">
            {accountName} · {formatDate(tx.date)}
            {tx.installment_number ? ` · Parcela ${tx.installment_number}` : ''}
          </span>
        </span>
      </span>
      <span
        className="ml-3 flex-shrink-0 text-sm font-semibold"
        style={{ color: isIncome ? '#2DD4BF' : '#FF7F50' }}
      >
        {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount))}
      </span>
    </button>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function TransacoesPage() {
  const initialMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  const [showCreate,    setShowCreate]    = useState(false)
  const [editing,       setEditing]       = useState<Transaction | null>(null)
  const [activeTab,     setActiveTab]     = useState<'expense' | 'income'>('expense')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { start, end } = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    return {
      start: `${selectedMonth}-01`,
      end: new Date(y, m, 0).toISOString().split('T')[0],
    }
  }, [selectedMonth])

  const { data: couple } = useCouple()
  const { showToast } = useToast()
  const isCouple = !!couple
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTransactions({ start, end, pageSize: 120 })
  const { data: accounts = [] } = useAccounts()
  const deleteTransaction = useDeleteTransaction()

  const transactions = useMemo(
    () => data?.pages.flatMap(page => page) ?? [],
    [data]
  )

  const accountMap = useMemo(
    () => Object.fromEntries(accounts.map(a => [a.id, a.name])),
    [accounts]
  )

  const expenses = useMemo(
    () => transactions.filter(t => t.type === 'expense'),
    [transactions]
  )

  const incomes = useMemo(
    () => transactions.filter(t => t.type === 'income'),
    [transactions]
  )

  const totalExpense = useMemo(
    () => expenses.reduce((s, t) => s + Number(t.amount), 0),
    [expenses]
  )

  const totalIncome = useMemo(
    () => incomes.reduce((s, t) => s + Number(t.amount), 0),
    [incomes]
  )

  const displayed = useMemo(
    () => (activeTab === 'expense' ? expenses : incomes),
    [activeTab, expenses, incomes]
  )

  const listRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: displayed.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 58,
    overscan: 10,
  })
  const virtualRows = rowVirtualizer.getVirtualItems()

  useEffect(() => {
    const last = virtualRows[virtualRows.length - 1]
    if (!last) return

    if (last.index >= displayed.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [displayed.length, fetchNextPage, hasNextPage, isFetchingNextPage, virtualRows])

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => {
      const now = new Date()
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const l = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      return { value: v, label: l.charAt(0).toUpperCase() + l.slice(1) }
    }),
    []
  )

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
          <h1 className="page-title">
            {c(isCouple, 'Seus gastos', 'Gastos de vocês')}
          </h1>
          <p className="page-subtitle mt-1">
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
          <p className="entity-title sm:text-lg font-bold" style={{ color: '#2DD4BF' }}>
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="card">
          <p className="label">Despesas</p>
          <p className="entity-title sm:text-lg font-bold" style={{ color: '#FF7F50' }}>
            {formatCurrency(totalExpense)}
          </p>
        </div>
        <div className="card">
          <p className="label">Saldo</p>
          <p className={`entity-title sm:text-lg font-bold ${
            totalIncome - totalExpense >= 0 ? 'text-[#0F172A]' : 'text-[#C2410C]'
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
            data-active={activeTab === tab.key}
            className="motion-tab px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.key ? tab.bg    : 'transparent',
              color:      activeTab === tab.key ? tab.color : '#334155',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <LoadingStatePanel rows={5} />
      ) : displayed.length === 0 ? (
        <EmptyStatePanel
          icon={
            activeTab === 'expense'
              ? <ArrowDownCircle size={26} className="text-[#FF7F50]" aria-hidden />
              : <ArrowUpCircle size={26} className="text-[#2DD4BF]" aria-hidden />
          }
          title={activeTab === 'expense' ? 'Nenhuma despesa no período' : 'Nenhuma receita no período'}
          description={activeTab === 'expense'
            ? c(isCouple, 'Nenhuma despesa registrada neste período', 'Nenhuma despesa registrada por vocês neste período')
            : c(isCouple, 'Nenhuma receita registrada neste período', 'Nenhuma receita registrada por vocês neste período')}
        />
      ) : (
        <div>
          <div ref={listRef} className="max-h-[62vh] overflow-auto pr-1">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualRows.map((virtualRow) => {
                const tx = displayed[virtualRow.index]
                if (!tx) return null

                return (
                  <div
                    key={tx.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <TxRow
                      tx={tx}
                      accountName={accountMap[tx.account_id] ?? '—'}
                      onClick={() => { setEditing(tx); setConfirmDelete(false) }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          {isFetchingNextPage && (
            <p className="text-xs text-[#334155] text-center mt-2">Carregando mais...</p>
          )}
        </div>
      )}

      {/* Total */}
      {displayed.length > 0 && (
        <div className="flex items-center justify-between px-2 py-2.5 mt-2 rounded-lg bg-white"
          style={{ border: '1px solid #D1D5DB' }}>
          <p className="meta-text">
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
                  className="touch-target w-full text-xs mt-1 text-[#334155]"
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

