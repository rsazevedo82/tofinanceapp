// app/(dashboard)/relatorios/page.tsx
'use client'

import { useState }        from 'react'
import { useReports }      from '@/hooks/useReports'
import { formatCurrency }  from '@/lib/utils/format'
import { useCouple }       from '@/hooks/useCouple'
import { c }               from '@/lib/utils/copy'
import { ChartCard, DataTable } from '@/components/reports/ChartCard'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCur(v: number) { return formatCurrency(v) }

function MonthSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const now     = new Date()
  const options = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    return { value: v, label: `${months[d.getMonth()]} ${d.getFullYear()}` }
  })

  return (
    <select
      className="input text-sm py-2 px-3 min-h-[44px]"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: 'auto' }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

interface TooltipEntry {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg text-xs shadow-xl bg-white"
      style={{ border: '1px solid #D1D5DB' }}>
      <p className="font-semibold text-[#0F172A] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtCur(p.value)}
        </p>
      ))}
    </div>
  )
}

const TABS = [
  { key: 'categories', label: 'Categorias'   },
  { key: 'monthly',    label: 'Evolução'     },
  { key: 'flow',       label: 'Fluxo diário' },
  { key: 'compare',    label: 'Comparativo'  },
  { key: 'cards',      label: 'Cartões'      },
  { key: 'projection', label: 'Projeção'     },
]

const chartColors = {
  income:     '#2DD4BF',
  expense:    '#FF7F50',
  balance:    '#6B7280',
  projection: '#F59E0B',
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const now = new Date()
  const def = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [month,     setMonth]     = useState(def)
  const [activeTab, setActiveTab] = useState('categories')

  const { data: couple }           = useCouple()
  const isCouple                   = !!couple
  const { data, isLoading, error } = useReports(month)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">

      {/* Header */}
      <div className="flex flex-col gap-4 mb-7 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight">
            {c(isCouple, 'Seus relatórios', 'Relatórios de vocês')}
          </h1>
          <p className="text-sm mt-1 text-[#6B7280]">
            {c(isCouple, 'Entenda melhor seu dinheiro', 'Entendam como vocês estão usando o dinheiro')}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <MonthSelector value={month} onChange={setMonth} />
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-5 md:mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: activeTab === tab.key ? 'rgba(255,127,80,0.1)' : 'transparent',
              color:      activeTab === tab.key ? '#FF7F50' : '#6B7280',
              border:     activeTab === tab.key
                ? '1px solid rgba(255,127,80,0.25)'
                : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card animate-pulse h-64" />)}
        </div>
      )}

      {/* Erro */}
      {error && (
        <p className="text-sm px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600">
          Erro ao carregar relatórios: {(error as Error).message}
        </p>
      )}

      {/* Conteudo */}
      {data && !isLoading && (
        <div className="space-y-4">

          {/* ── ABA 1: CATEGORIAS ── */}
          {activeTab === 'categories' && (
            <ChartCard title="Gastos por categoria" subtitle={`Despesas de ${data.period.month}`}>
              {data.categories.length === 0 ? (
                <p className="text-xs text-center py-8 text-[#6B7280]">
                  {c(isCouple, 'Nenhuma despesa categorizada neste mês', 'Vocês ainda não categorizaram despesas este mês')}
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.categories}
                        dataKey="total"
                        nameKey="category_name"
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85}
                        paddingAngle={2}
                      >
                        {data.categories.map((entry, i) => (
                          <Cell key={i} fill={entry.category_color ?? `hsl(${i * 40}, 60%, 55%)`} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(v) => <span style={{ color: '#6B7280', fontSize: 11 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                  <DataTable
                    columns={[
                      { key: 'category_name', label: 'Categoria' },
                      { key: 'count',         label: 'Qtd',   align: 'right' },
                      { key: 'total',         label: 'Total', align: 'right' },
                      { key: 'percent',       label: '%',     align: 'right' },
                    ]}
                    rows={data.categories as unknown as Record<string, unknown>[]}
                    formatValue={(k, v) => {
                      if (k === 'total')   return fmtCur(Number(v))
                      if (k === 'percent') return `${v}%`
                      return String(v ?? '—')
                    }}
                  />
                </>
              )}
            </ChartCard>
          )}

          {/* ── ABA 2: EVOLUCAO ── */}
          {activeTab === 'monthly' && (
            <ChartCard title="Evolução mensal" subtitle="Receitas e despesas dos últimos 6 meses">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthly} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income"  name="Receitas" fill={chartColors.income}  radius={[4,4,0,0]} />
                  <Bar dataKey="expense" name="Despesas" fill={chartColors.expense} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <DataTable
                columns={[
                  { key: 'label',   label: 'Mês'      },
                  { key: 'income',  label: 'Receitas', align: 'right' },
                  { key: 'expense', label: 'Despesas', align: 'right' },
                  { key: 'net',     label: 'Saldo',    align: 'right' },
                ]}
                rows={data.monthly as unknown as Record<string, unknown>[]}
                formatValue={(k, v) =>
                  ['income','expense','net'].includes(k) ? fmtCur(Number(v)) : String(v ?? '—')
                }
              />
            </ChartCard>
          )}

          {/* ── ABA 3: FLUXO DIARIO ── */}
          {activeTab === 'flow' && (
            <ChartCard title="Fluxo de caixa diário" subtitle={`Entradas, saídas e saldo acumulado em ${data.period.month}`}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.daily_flow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line dataKey="income"  name="Entrada" stroke={chartColors.income}  dot={false} strokeWidth={2} />
                  <Line dataKey="expense" name="Saída"   stroke={chartColors.expense} dot={false} strokeWidth={2} />
                  <Line dataKey="balance" name="Saldo"   stroke={chartColors.balance} dot={false} strokeWidth={2} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
              <DataTable
                columns={[
                  { key: 'label',   label: 'Dia'        },
                  { key: 'income',  label: 'Entrada',    align: 'right' },
                  { key: 'expense', label: 'Saída',      align: 'right' },
                  { key: 'balance', label: 'Acumulado',  align: 'right' },
                ]}
                rows={data.daily_flow.filter(d => d.income > 0 || d.expense > 0) as unknown as Record<string, unknown>[]}
                formatValue={(k, v) =>
                  ['income','expense','balance'].includes(k) ? fmtCur(Number(v)) : String(v ?? '—')
                }
              />
            </ChartCard>
          )}

          {/* ── ABA 4: COMPARATIVO ── */}
          {activeTab === 'compare' && (
            <ChartCard title="Comparativo mensal" subtitle="Mês atual vs mês anterior">
              {data.monthly.length < 2 ? (
                <p className="text-xs text-center py-8 text-[#6B7280]">
                  Dados insuficientes para comparativo
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {(['income','expense'] as const).map(type => {
                      const cur  = data.monthly[data.monthly.length - 1]
                      const prev = data.monthly[data.monthly.length - 2]
                      const curV  = cur[type]
                      const prevV = prev[type]
                      const diff  = curV - prevV
                      const pct   = prevV > 0 ? ((diff / prevV) * 100).toFixed(1) : '—'
                      const isGood = type === 'income' ? diff >= 0 : diff <= 0
                      return (
                        <div key={type} className="p-3 rounded-xl bg-white"
                          style={{ border: '1px solid #D1D5DB' }}>
                          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2"
                            style={{ color: type === 'income' ? '#2DD4BF' : '#FF7F50' }}>
                            {type === 'income' ? 'Receitas' : 'Despesas'}
                          </p>
                          <p className="text-base font-black text-[#0F172A]">{fmtCur(curV)}</p>
                          <p className="text-xs mt-1 text-[#6B7280]">
                            Anterior: {fmtCur(prevV)}
                          </p>
                          {prevV > 0 && (
                            <p className="text-xs font-semibold mt-0.5"
                              style={{ color: isGood ? '#2DD4BF' : '#FF7F50' }}>
                              {diff >= 0 ? '+' : ''}{pct}%
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.monthly.slice(-3)} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                      <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="income"  name="Receitas" fill={chartColors.income}  radius={[4,4,0,0]} />
                      <Bar dataKey="expense" name="Despesas" fill={chartColors.expense} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </ChartCard>
          )}

          {/* ── ABA 5: CARTOES ── */}
          {activeTab === 'cards' && (
            <ChartCard title="Limites dos cartões" subtitle="Uso atual do limite de crédito">
              {data.card_limits.length === 0 ? (
                <p className="text-xs text-center py-8 text-[#6B7280]">
                  Nenhum cartão de crédito cadastrado
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {data.card_limits.map(card => (
                      <div key={card.account_id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: card.color ?? '#FF7F50' }} />
                            <p className="text-sm text-[#0F172A]">{card.name}</p>
                          </div>
                          <p className="text-xs text-[#6B7280]">
                            {fmtCur(card.used)} / {fmtCur(card.credit_limit)}
                          </p>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden bg-[#E5E7EB]">
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width:      `${card.percent}%`,
                              background: card.percent > 80 ? '#ef4444' : card.percent > 50 ? '#F59E0B' : card.color ?? '#2DD4BF',
                            }}
                          />
                        </div>
                        <p className="text-[10px] mt-0.5 text-[#6B7280]">
                          {card.percent}% utilizado · {fmtCur(card.available)} disponível
                        </p>
                      </div>
                    ))}
                  </div>
                  <DataTable
                    columns={[
                      { key: 'name',         label: 'Cartão'      },
                      { key: 'credit_limit', label: 'Limite',     align: 'right' },
                      { key: 'used',         label: 'Utilizado',  align: 'right' },
                      { key: 'available',    label: 'Disponível', align: 'right' },
                      { key: 'percent',      label: '%',          align: 'right' },
                    ]}
                    rows={data.card_limits as unknown as Record<string, unknown>[]}
                    formatValue={(k, v) => {
                      if (['credit_limit','used','available'].includes(k)) return fmtCur(Number(v))
                      if (k === 'percent') return `${v}%`
                      return String(v ?? '—')
                    }}
                  />
                </>
              )}
            </ChartCard>
          )}

          {/* ── ABA 6: PROJECAO ── */}
          {activeTab === 'projection' && (
            <ChartCard
              title="Projeção financeira"
              subtitle="Saldo projetado para os próximos 3 meses com base na média histórica"
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.projection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line dataKey="projected_income"  name="Receita proj."  stroke={chartColors.income}     strokeWidth={2} dot={false} />
                  <Line dataKey="projected_expense" name="Despesa proj."  stroke={chartColors.expense}    strokeWidth={2} dot={false} />
                  <Line dataKey="projected_balance" name="Saldo proj."    stroke={chartColors.balance}    strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>

              <p className="text-[10px] mb-3 text-[#6B7280]">
                Baseado na média dos últimos 3 meses
              </p>

              <DataTable
                columns={[
                  { key: 'label',             label: 'Mês'      },
                  { key: 'projected_income',  label: 'Receita',  align: 'right' },
                  { key: 'projected_expense', label: 'Despesa',  align: 'right' },
                  { key: 'projected_balance', label: 'Saldo',    align: 'right' },
                  { key: 'is_projection',     label: 'Tipo',     align: 'right' },
                ]}
                rows={data.projection as unknown as Record<string, unknown>[]}
                formatValue={(k, v) => {
                  if (['projected_income','projected_expense','projected_balance'].includes(k))
                    return fmtCur(Number(v))
                  if (k === 'is_projection') return v ? 'Projeção' : 'Real'
                  return String(v ?? '—')
                }}
              />
            </ChartCard>
          )}

        </div>
      )}
    </div>
  )
}
