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

const TYPE_ICONS: Record<string, string> = {
  couple_invite:   '💌',
  couple_accepted: '💑',
  couple_unlinked: '💔',
  goal_reached:    '🎯',
  invoice_closed:  '💳',
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

  const { data, isLoading } = useQuery({
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight">
            {c(isCouple, 'Visão geral', 'Como vocês estão hoje')}
          </h1>
          <p className="text-sm md:text-base font-bold capitalize mt-1 text-[#6B7280]">
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
          className="mb-6 md:mb-8 rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(255,127,80,0.25)', background: 'rgba(255,127,80,0.05)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,127,80,0.15)' }}
          >
            <p className="text-sm font-bold text-[#0F172A]">
              {unread.length} notificaç{unread.length === 1 ? 'ão' : 'ões'} não lida{unread.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="text-xs font-medium text-[#FF7F50] hover:text-[#e86e40] transition-colors"
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
                <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{n.title}</p>
                  <p className="text-sm mt-0.5 text-[#6B7280] line-clamp-2">{n.body}</p>
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
                <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{n.title}</p>
                  <p className="text-sm mt-0.5 text-[#6B7280]">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
          {unread.length > 3 && (
            <p className="px-5 py-3 text-xs text-[#6B7280]">
              +{unread.length - 3} notificações no sino acima
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-28" />)}
        </div>
      ) : data ? (
        <>
          {/* ── KPIs principais ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">

            {/* Saldo */}
            <div className="card sm:col-span-1">
              <p className="label">Saldo em contas</p>
              <p className={`text-2xl md:text-3xl font-black tracking-tight mt-1 ${
                data.total_balance >= 0 ? 'text-[#0F172A]' : 'text-[#EF4444]'
              }`}>
                {formatCurrency(data.total_balance)}
              </p>
              <p className="text-xs mt-2 text-[#6B7280]">
                Exclui limite de cartões de crédito
              </p>
            </div>

            {/* Receitas */}
            <div className="card">
              <p className="label">Receitas</p>
              <p className="text-2xl md:text-3xl font-black tracking-tight mt-1 text-[#2DD4BF]">
                {formatCurrency(data.income_month)}
              </p>
              <p className="text-xs mt-2 text-[#6B7280]">Entradas no mês</p>
            </div>

            {/* Despesas */}
            <div className="card">
              <p className="label">Despesas</p>
              <p className="text-2xl md:text-3xl font-black tracking-tight mt-1 text-[#EF4444]">
                {formatCurrency(data.expense_month)}
              </p>
              <p className="text-xs mt-2 text-[#6B7280]">Saídas no mês</p>
            </div>
          </div>

          {/* ── Saldo do mês ── */}
          <div className="card mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="label">{c(isCouple, 'Seu saldo no mês', 'Saldo de vocês no mês')}</p>
              <p className={`text-2xl font-black tracking-tight mt-1 ${
                data.net_month >= 0 ? 'text-[#2DD4BF]' : 'text-[#EF4444]'
              }`}>
                {data.net_month >= 0 ? '+' : ''}{formatCurrency(data.net_month)}
              </p>
            </div>
            {data.income_month > 0 && (
              <div className="text-right shrink-0">
                <p className="text-xs text-[#6B7280] mb-1 font-bold uppercase tracking-wider">Taxa de poupança</p>
                <p className={`text-2xl font-black tracking-tight ${
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
                {data.cards.map(card => (
                  <div
                    key={card.id}
                    onClick={() => router.push(`/fatura/${card.id}`)}
                    className="card cursor-pointer transition-all hover:shadow-md"
                    style={{ borderColor: card.color ? `${card.color}50` : '#D1D5DB' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">💳</span>
                        <p className="text-base font-bold text-[#0F172A]">{card.name}</p>
                      </div>
                      <span className="text-xs text-[#6B7280] font-medium">
                        Fecha dia {card.closing_day} · <span className="text-[#FF7F50]">Ver fatura →</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1 text-[#6B7280]">Fatura aberta</p>
                        <p className="text-lg font-black text-[#EF4444]">
                          {formatCurrency(card.open_invoice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1 text-[#6B7280]">Disponível</p>
                        <p className="text-lg font-black text-[#2DD4BF]">
                          {formatCurrency(card.available)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1 text-[#6B7280]">Limite</p>
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
                ))}
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
                  className="text-xs font-semibold text-[#FF7F50] hover:text-[#e86e40] transition-colors"
                >
                  Ver todas →
                </button>
              </div>

              <div className="space-y-1">
                {data.recent_transactions.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-[#6B7280]">
                      {c(isCouple, 'Você ainda não registrou gastos este mês', 'Vocês ainda não registraram gastos este mês')}
                    </p>
                  </div>
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
                          <p className="text-sm font-semibold text-[#0F172A] truncate">{tx.description}</p>
                          <p className="text-xs mt-0.5 text-[#6B7280]">
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
                  className="text-xs font-semibold text-[#FF7F50] hover:text-[#e86e40] transition-colors"
                >
                  Ver relatórios →
                </button>
              </div>

              {data.top_categories.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-[#6B7280]">
                    {c(isCouple, 'Nenhum gasto categorizado este mês', 'Vocês ainda não categorizaram gastos este mês')}
                  </p>
                </div>
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
                          <p className="text-sm font-semibold text-[#0F172A]">{cat.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-[#0F172A]">
                            {formatCurrency(cat.total)}
                          </p>
                          <p className="text-xs font-bold w-8 text-right text-[#6B7280]">
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
