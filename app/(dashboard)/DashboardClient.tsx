// app/(dashboard)/page.tsx
'use client'

import { useQuery }                              from '@tanstack/react-query'
import { useRouter }                             from 'next/navigation'
import dynamic                                   from 'next/dynamic'
import { formatCurrency }                        from '@/lib/utils/format'
import { Modal }                                 from '@/components/ui/Modal'
import { useMemo, useState }                     from 'react'
import { useNotifications, useMarkAllAsRead }    from '@/hooks/useNotifications'
import { useCouple }                             from '@/hooks/useCouple'
import { c }                                     from '@/lib/utils/copy'
import { OnboardingChecklist }                   from '@/components/ui/OnboardingChecklist'
import { EmptyStatePanel, ErrorStatePanel, LoadingStatePanel } from '@/components/ui/StatePanel'
import { NotificationTypeIcon }                  from '@/components/ui/NotificationTypeIcon'
import { CreditCard }                            from 'lucide-react'
import type { ApiResponse }                      from '@/types'
import type { Notification }                     from '@/types'
import type { DashboardData }                    from '@/app/api/dashboard/route'

const TransactionForm = dynamic(
  () => import('@/components/finance/TransactionForm').then(m => m.TransactionForm),
  { ssr: false }
)

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit',
  })
}

export default function DashboardPage() {
  const router              = useRouter()
  const [showTx, setShowTx] = useState(false)

  const { data: couple }             = useCouple()
  const isCouple                     = !!couple
  const { data: notifications = [] } = useNotifications()
  const markAllAsRead                = useMarkAllAsRead()

  const unread = useMemo(
    () => notifications.filter((n: Notification) => !n.read_at),
    [notifications]
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  async (): Promise<DashboardData> => {
      const res  = await fetch('/api/dashboard')
      const json: ApiResponse<DashboardData> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data!
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
  })

  const month = useMemo(
    () => new Date().toLocaleDateString('pt-BR', {
      month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo',
    }),
    []
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-10">
        <div>
          <h1 className="page-title">
            {c(isCouple, 'Visão geral', 'Como vocês estão hoje')}
          </h1>
          <p className="page-subtitle capitalize mt-1">
            {month}
          </p>
        </div>
        <button onClick={() => setShowTx(true)} className="btn-primary w-full sm:w-auto">
          <span className="text-lg leading-none">+</span>
          Registrar gasto
        </button>
      </div>

      {/* ── Notificações não lidas ── */}
      {unread.length > 0 && (
        <div
          className="motion-enter mb-6 md:mb-8 rounded-xl overflow-hidden card card-compact"
          style={{ borderColor: 'rgba(15,118,110,0.22)', background: 'rgba(15,118,110,0.06)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid rgba(15,118,110,0.14)' }}
          >
            <p className="text-sm font-bold text-[#3F342C] flex items-center gap-2">
              <span className="status-chip status-chip-highlight">{unread.length}</span>
              notificaç{unread.length === 1 ? 'ão' : 'ões'} não lida{unread.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="action-link"
            >
              Marcar todas como lidas
            </button>
          </div>

          <div className="md:hidden">
            {unread.slice(0, 1).map((n: Notification) => (
              <div
                key={n.id}
                className="flex items-start gap-3 px-4 py-3.5"
                style={{ borderBottom: '1px solid #D1D5DB' }}
              >
                <span className="flex-shrink-0 mt-0.5">
                  <NotificationTypeIcon type={n.type} className="h-4 w-4 text-[#475569]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{n.title}</p>
                  <p className="text-sm mt-0.5 text-[#334155] line-clamp-2">{n.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            {unread.slice(0, 3).map((n: Notification) => (
              <div
                key={n.id}
                className="flex items-start gap-3 px-5 py-4"
                style={{ borderBottom: '1px solid #D1D5DB' }}
              >
                <span className="flex-shrink-0 mt-0.5">
                  <NotificationTypeIcon type={n.type} className="h-4 w-4 text-[#475569]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{n.title}</p>
                  <p className="text-sm mt-0.5 text-[#334155]">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
          {unread.length > 3 && (
            <p className="px-5 py-3 text-xs text-[#334155]">
              +{unread.length - 3} notificações no sino acima
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <LoadingStatePanel rows={4} />
      ) : error ? (
        <ErrorStatePanel
          description={error instanceof Error ? error.message : 'Tente novamente em instantes.'}
          onRetry={() => window.location.reload()}
        />
      ) : data ? (
        <>
          {/* ── KPIs principais ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">

            {/* Saldo */}
            <div className="motion-enter motion-delay-1 card card-compact sm:col-span-1">
              <p className="label">Saldo em contas</p>
              <p className={`kpi-value mt-1 ${
                data.total_balance >= 0 ? 'text-[#0F172A]' : 'text-[#EF4444]'
              }`}>
                {formatCurrency(data.total_balance)}
              </p>
              <p className="meta-text mt-2">
                Exclui limite de cartões de crédito
              </p>
            </div>

            {/* Receitas */}
            <div className="motion-enter motion-delay-2 card card-compact">
              <p className="label">Receitas</p>
              <p className="kpi-value mt-1 text-[#2DD4BF]">
                {formatCurrency(data.income_month)}
              </p>
              <p className="meta-text mt-2">Entradas no mês</p>
            </div>

            {/* Despesas */}
            <div className="motion-enter motion-delay-3 card card-compact">
              <p className="label">Despesas</p>
              <p className="kpi-value mt-1 text-[#EF4444]">
                {formatCurrency(data.expense_month)}
              </p>
              <p className="meta-text mt-2">Saídas no mês</p>
            </div>
          </div>

          {/* ── Saldo do mês ── */}
          <div className="motion-enter motion-delay-4 card card-compact mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="label">{c(isCouple, 'Seu saldo no mês', 'Saldo de vocês no mês')}</p>
              <p className={`kpi-value mt-1 ${
                data.net_month >= 0 ? 'text-[#2DD4BF]' : 'text-[#EF4444]'
              }`}>
                {data.net_month >= 0 ? '+' : ''}{formatCurrency(data.net_month)}
              </p>
            </div>
            {data.income_month > 0 && (
              <div className="text-right shrink-0">
                <p className="data-label mb-1">Taxa de poupança</p>
                <p className={`kpi-value ${
                  data.net_month >= 0 ? 'text-[#2DD4BF]' : 'text-[#EF4444]'
                }`}>
                  {`${Math.round((data.net_month / data.income_month) * 100)}%`}
                </p>
              </div>
            )}
          </div>

          {/* ── Onboarding ── */}
          <div className="mb-6">
            <OnboardingChecklist
              dashboardData={data}
              onNewTransaction={() => setShowTx(true)}
            />
          </div>

          {/* ── Cartões de crédito ── */}
          {data.cards.length > 0 && (
            <div className="mb-8">
              <p className="section-heading">Cartões de crédito</p>
              <div className="space-y-3">
                {data.cards.map(card => {
                  const usagePercent = card.credit_limit > 0
                    ? Math.min(Math.round((card.open_invoice / card.credit_limit) * 100), 100)
                    : 0
                  const usageTone = usagePercent > 80
                    ? 'status-chip-danger'
                    : usagePercent > 50
                    ? 'status-chip-warning'
                    : 'status-chip-success'

                  return (
                  <div
                    key={card.id}
                    onClick={() => router.push(`/fatura/${card.id}`)}
                    className="card card-compact cursor-pointer transition-[border-color,box-shadow,transform] hover:shadow-md"
                    style={{ borderColor: card.color ? `${card.color}50` : '#D1D5DB' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <CreditCard size={18} className="text-[#475569]" aria-hidden />
                        <p className="text-base font-bold text-[#0F172A]">{card.name}</p>
                      </div>
                      <span className="meta-text font-medium flex items-center gap-2">
                        <span className={`status-chip ${usageTone}`}>{usagePercent}% usado</span>
                        <span>Fecha dia {card.closing_day} · <span className="text-[#C2410C]">Ver fatura →</span></span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="data-label mb-1">Fatura aberta</p>
                        <p className="text-lg font-black text-[#EF4444]">
                          {formatCurrency(card.open_invoice)}
                        </p>
                      </div>
                      <div>
                        <p className="data-label mb-1">Disponível</p>
                        <p className="text-lg font-black text-[#2DD4BF]">
                          {formatCurrency(card.available)}
                        </p>
                      </div>
                      <div>
                        <p className="data-label mb-1">Limite</p>
                        <p className="text-lg font-black text-[#0F172A]">
                          {formatCurrency(card.credit_limit)}
                        </p>
                      </div>
                    </div>

                    {/* Barra de uso */}
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((card.open_invoice / card.credit_limit) * 100, 100)}%`,
                          background: card.open_invoice / card.credit_limit > 0.8
                            ? '#EF4444'
                            : card.open_invoice / card.credit_limit > 0.5
                            ? '#FF7F50'
                            : card.color ?? '#2DD4BF',
                        }}
                      />
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

            {/* ── Transações recentes ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="section-heading mb-0">
                  {c(isCouple, 'Seus últimos gastos', 'Últimos gastos de vocês')}
                </p>
                <button
                  onClick={() => router.push('/transacoes')}
                  className="action-link"
                >
                  Ver todas →
                </button>
              </div>

              <div className="space-y-1">
                {data.recent_transactions.length === 0 ? (
                  <EmptyStatePanel
                    tone="finance"
                    title={c(isCouple, 'Sem transações no período', 'Sem transações de vocês no período')}
                    description={c(
                      isCouple,
                      'Registre sua primeira movimentação para começar os insights.',
                      'Registrem a primeira movimentação para começar os insights do casal.'
                    )}
                    nextSteps={[
                      'Registre uma despesa ou receita',
                      'Use categorias para melhorar os relatórios mensais',
                    ]}
                    action={(
                      <button onClick={() => setShowTx(true)} className="btn-primary w-full sm:w-auto justify-center">
                        Registrar primeira transação
                      </button>
                    )}
                  />
                ) : (
                  data.recent_transactions.map(tx => (
                    <div key={tx.id} className="db-row flex items-center justify-between px-3 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                          style={{
                            background: tx.type === 'income'
                              ? 'rgba(45,212,191,0.12)'
                              : 'rgba(239,68,68,0.1)',
                            color: tx.type === 'income' ? '#2DD4BF' : '#EF4444',
                          }}
                        >
                          {tx.type === 'income' ? '↑' : '↓'}
                        </div>
                        <div className="min-w-0">
                          <p className="entity-title truncate">{tx.description}</p>
                          <p className="entity-meta mt-0.5">
                            {tx.category_name ?? '—'} · {formatDate(tx.date)}
                          </p>
                        </div>
                      </div>
                      <p
                        className="text-sm font-bold flex-shrink-0 ml-3"
                        style={{ color: tx.type === 'income' ? '#2DD4BF' : '#EF4444' }}
                      >
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Top categorias ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="section-heading mb-0">
                  {c(isCouple, 'Onde você mais gastou', 'Onde vocês mais gastaram')}
                </p>
                <button
                  onClick={() => router.push('/relatorios')}
                  className="action-link"
                >
                  Ver relatórios →
                </button>
              </div>

              {data.top_categories.length === 0 ? (
                <EmptyStatePanel
                  tone="category"
                  title={c(isCouple, 'Sem categorias no período', 'Sem categorias de gastos no período')}
                  description={c(
                    isCouple,
                    'Classifique seus lançamentos para ver onde você mais gasta.',
                    'Classifiquem os lançamentos para ver onde vocês mais gastam.'
                  )}
                  nextSteps={[
                    'Abra uma transação e defina uma categoria',
                    'Use relatórios para comparar hábitos por mês',
                  ]}
                />
              ) : (
                <div className="space-y-4">
                  {data.top_categories.map((cat, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{ background: cat.color ?? '#FF7F50' }}
                          />
                          <p className="entity-title">{cat.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-[#0F172A]">
                            {formatCurrency(cat.total)}
                          </p>
                          <p className="data-label w-8 text-right">
                            {cat.percent}%
                          </p>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width:      `${cat.percent}%`,
                            background: cat.color ?? '#FF7F50',
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

      <Modal isOpen={showTx} onClose={() => setShowTx(false)} title="Nova transação">
        <TransactionForm onSuccess={() => setShowTx(false)} />
      </Modal>
    </div>
  )
}

