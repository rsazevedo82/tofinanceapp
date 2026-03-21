// app/(dashboard)/page.tsx
'use client'

import { useQuery }           from '@tanstack/react-query'
import { useRouter }          from 'next/navigation'
import { formatCurrency }     from '@/lib/utils/format'
import { Modal }              from '@/components/ui/Modal'
import { TransactionForm }    from '@/components/finance/TransactionForm'
import { useState }           from 'react'
import type { ApiResponse }   from '@/types'
import type { DashboardData } from '@/app/api/dashboard/route'

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit',
  })
}

export default function DashboardPage() {
  const router          = useRouter()
  const [showTx, setShowTx] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  async (): Promise<DashboardData> => {
      const res  = await fetch('/api/dashboard')
      const json: ApiResponse<DashboardData> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data!
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30,
  })

  const now   = new Date()
  const month = now.toLocaleDateString('pt-BR', {
    month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo',
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Dashboard</h1>
          <p className="text-sm capitalize mt-0.5" style={{ color: 'rgba(200,198,190,0.35)' }}>
            {month}
          </p>
        </div>
        <button onClick={() => setShowTx(true)} className="btn-primary text-xs">
          <span className="opacity-60">+</span>
          Nova transacao
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      ) : data ? (
        <>
          {/* ── KPIs principais ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="card sm:col-span-2">
              <p className="label">Saldo em contas</p>
              <p className={`text-2xl font-semibold tracking-tight ${
                data.total_balance >= 0 ? 'text-[#f0ede8]' : 'text-[#fca5a5]'
              }`}>
                {formatCurrency(data.total_balance)}
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(200,198,190,0.3)' }}>
                Exclui limite de cartoes de credito
              </p>
            </div>
            <div className="card">
              <p className="label">Receitas</p>
              <p className="text-xl font-semibold tracking-tight" style={{ color: '#6ee7b7' }}>
                {formatCurrency(data.income_month)}
              </p>
            </div>
            <div className="card">
              <p className="label">Despesas</p>
              <p className="text-xl font-semibold tracking-tight" style={{ color: '#fca5a5' }}>
                {formatCurrency(data.expense_month)}
              </p>
            </div>
          </div>

          {/* ── Saldo do mes ── */}
          <div className="card mb-6 flex items-center justify-between">
            <div>
              <p className="label">Saldo do mes</p>
              <p className={`text-lg font-semibold ${
                data.net_month >= 0 ? 'text-[#6ee7b7]' : 'text-[#fca5a5]'
              }`}>
                {data.net_month >= 0 ? '+' : ''}{formatCurrency(data.net_month)}
              </p>
            </div>
            {data.income_month > 0 && (
              <div className="text-right">
                <p className="text-[10px] mb-1" style={{ color: 'rgba(200,198,190,0.35)' }}>
                  Taxa de poupanca
                </p>
                <p className="text-lg font-semibold text-[#818cf8]">
                  {data.income_month > 0
                    ? `${Math.round((data.net_month / data.income_month) * 100)}%`
                    : '—'}
                </p>
              </div>
            )}
          </div>

          {/* ── Cartoes de credito ── */}
          {data.cards.length > 0 && (
            <div className="mb-6">
              <p className="section-heading">Cartoes de credito</p>
              <div className="space-y-2">
                {data.cards.map(card => (
                  <div
                    key={card.id}
                    onClick={() => router.push(`/fatura/${card.id}`)}
                    className="card cursor-pointer transition-all hover:border-white/[0.12]"
                    style={{ borderColor: card.color ? `${card.color}25` : undefined }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span>💳</span>
                        <p className="text-sm font-medium text-[#e8e6e1]">{card.name}</p>
                      </div>
                      <span className="text-[10px]" style={{ color: 'rgba(200,198,190,0.35)' }}>
                        Fecha dia {card.closing_day} · Ver fatura →
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest mb-0.5"
                          style={{ color: 'rgba(200,198,190,0.35)' }}>Fatura aberta</p>
                        <p className="text-sm font-semibold text-[#fbbf24]">
                          {formatCurrency(card.open_invoice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest mb-0.5"
                          style={{ color: 'rgba(200,198,190,0.35)' }}>Disponivel</p>
                        <p className="text-sm font-semibold text-[#6ee7b7]">
                          {formatCurrency(card.available)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest mb-0.5"
                          style={{ color: 'rgba(200,198,190,0.35)' }}>Limite</p>
                        <p className="text-sm font-semibold text-[#f0ede8]">
                          {formatCurrency(card.credit_limit)}
                        </p>
                      </div>
                    </div>

                    {/* Barra de uso */}
                    <div className="h-1 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((card.open_invoice / card.credit_limit) * 100, 100)}%`,
                          background: card.open_invoice / card.credit_limit > 0.8
                            ? '#f87171'
                            : card.open_invoice / card.credit_limit > 0.5
                            ? '#fbbf24'
                            : card.color ?? '#6ee7b7',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ── Transacoes recentes ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="section-heading mb-0">Transacoes recentes</p>
                <button
                  onClick={() => router.push('/transacoes')}
                  className="text-[10px] transition-colors"
                  style={{ color: 'rgba(200,198,190,0.4)' }}
                >
                  Ver todas →
                </button>
              </div>

              <div className="space-y-0.5">
                {data.recent_transactions.length === 0 ? (
                  <p className="text-xs py-6 text-center" style={{ color: 'rgba(200,198,190,0.3)' }}>
                    Nenhuma transacao este mes
                  </p>
                ) : (
                  data.recent_transactions.map(tx => (
                    <div key={tx.id} className="db-row flex items-center justify-between px-2 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs flex-shrink-0"
                          style={{ color: tx.type === 'income' ? '#6ee7b7' : '#fca5a5' }}>
                          {tx.type === 'income' ? '↑' : '↓'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-[#e8e6e1] truncate">{tx.description}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(200,198,190,0.35)' }}>
                            {tx.category_name ?? '—'} · {formatDate(tx.date)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-medium flex-shrink-0 ml-2"
                        style={{ color: tx.type === 'income' ? '#6ee7b7' : '#fca5a5' }}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Top categorias ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="section-heading mb-0">Maiores gastos</p>
                <button
                  onClick={() => router.push('/relatorios')}
                  className="text-[10px] transition-colors"
                  style={{ color: 'rgba(200,198,190,0.4)' }}
                >
                  Ver relatorios →
                </button>
              </div>

              {data.top_categories.length === 0 ? (
                <p className="text-xs py-6 text-center" style={{ color: 'rgba(200,198,190,0.3)' }}>
                  Nenhum gasto categorizado este mes
                </p>
              ) : (
                <div className="space-y-2">
                  {data.top_categories.map((cat, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm flex-shrink-0"
                            style={{ background: cat.color ?? '#94a3b8' }} />
                          <p className="text-xs text-[#e8e6e1]">{cat.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-[#f0ede8]">
                            {formatCurrency(cat.total)}
                          </p>
                          <p className="text-[10px] w-7 text-right"
                            style={{ color: 'rgba(200,198,190,0.4)' }}>
                            {cat.percent}%
                          </p>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width:      `${cat.percent}%`,
                            background: cat.color ?? '#94a3b8',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      <Modal isOpen={showTx} onClose={() => setShowTx(false)} title="Nova transacao">
        <TransactionForm onSuccess={() => setShowTx(false)} />
      </Modal>
    </div>
  )
}