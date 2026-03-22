// app/(dashboard)/relatorios/page.tsx
'use client'

import { useState }        from 'react'
import { useReports }      from '@/hooks/useReports'
import { formatCurrency }  from '@/lib/utils/format'
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
      className="input text-xs py-1.5 px-2"
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg text-xs shadow-xl"
      style={{ background: '#1c1c1a', border: '0.5px solid rgba(255,255,255,0.1)' }}>
      <p className="font-medium text-[#e8e6e1] mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtCur(p.value)}
        </p>
      ))}
    </div>
  )
}

const TABS = [
  { key: 'categories', label: 'Categorias'   },
  { key: 'monthly',    label: 'Evolucao'     },
  { key: 'flow',       label: 'Fluxo diario' },
  { key: 'compare',    label: 'Comparativo'  },
  { key: 'cards',      label: 'Cartoes'      },
  { key: 'projection', label: 'Projecao'     },
]

const chartColors = {
  income:     '#6ee7b7',
  expense:    '#fca5a5',
  balance:    '#818cf8',
  projection: '#fbbf24',
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const now = new Date()
  const def = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [month,     setMonth]     = useState(def)
  const [activeTab, setActiveTab] = useState('categories')

  const { data, isLoading, error } = useReports(month)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Relatorios</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Analise detalhada das suas financas
          </p>
        </div>
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: activeTab === tab.key ? 'rgba(255,255,255,0.08)' : 'transparent',
              color:      activeTab === tab.key ? '#e8e6e1' : 'rgba(200,198,190,0.4)',
              border:     activeTab === tab.key
                ? '0.5px solid rgba(255,255,255,0.12)'
                : '0.5px solid transparent',
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
        <p className="text-xs px-4 py-3 rounded-xl"
          style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
          Erro ao carregar relatorios: {(error as Error).message}
        </p>
      )}

      {/* Conteudo */}
      {data && !isLoading && (
        <div className="space-y-4">

          {/* ── ABA 1: CATEGORIAS ── */}
          {activeTab === 'categories' && (
            <ChartCard title="Gastos por categoria" subtitle={`Despesas de ${data.period.month}`}>
              {data.categories.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma despesa categorizada neste mes
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
                          <Cell key={i} fill={entry.category_color ?? `hsl(${i * 40}, 60%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 11 }}>{v}</span>} />
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
            <ChartCard title="Evolucao mensal" subtitle="Receitas e despesas dos ultimos 6 meses">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthly} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income"  name="Receitas" fill={chartColors.income}  radius={[4,4,0,0]} />
                  <Bar dataKey="expense" name="Despesas" fill={chartColors.expense} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <DataTable
                columns={[
                  { key: 'label',   label: 'Mes'      },
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
            <ChartCard title="Fluxo de caixa diario" subtitle={`Entradas, saidas e saldo acumulado em ${data.period.month}`}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.daily_flow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line dataKey="income"  name="Entrada" stroke={chartColors.income}  dot={false} strokeWidth={2} />
                  <Line dataKey="expense" name="Saida"   stroke={chartColors.expense} dot={false} strokeWidth={2} />
                  <Line dataKey="balance" name="Saldo"   stroke={chartColors.balance} dot={false} strokeWidth={2} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
              <DataTable
                columns={[
                  { key: 'label',   label: 'Dia'        },
                  { key: 'income',  label: 'Entrada',    align: 'right' },
                  { key: 'expense', label: 'Saida',      align: 'right' },
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
            <ChartCard title="Comparativo mensal" subtitle="Mes atual vs mes anterior">
              {data.monthly.length < 2 ? (
                <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
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
                        <div key={type} className="p-3 rounded-xl"
                          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
                          <p className="text-[10px] uppercase tracking-widest font-medium mb-2"
                            style={{ color: type === 'income' ? '#6ee7b7' : '#fca5a5' }}>
                            {type === 'income' ? 'Receitas' : 'Despesas'}
                          </p>
                          <p className="text-base font-semibold text-[#f0ede8]">{fmtCur(curV)}</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            Anterior: {fmtCur(prevV)}
                          </p>
                          {prevV > 0 && (
                            <p className="text-xs font-medium mt-0.5"
                              style={{ color: isGood ? '#6ee7b7' : '#fca5a5' }}>
                              {diff >= 0 ? '+' : ''}{pct}%
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.monthly.slice(-3)} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
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
            <ChartCard title="Limites dos cartoes" subtitle="Uso atual do limite de credito">
              {data.card_limits.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  Nenhum cartao de credito cadastrado
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {data.card_limits.map(card => (
                      <div key={card.account_id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: card.color ?? '#818cf8' }} />
                            <p className="text-sm text-[#e8e6e1]">{card.name}</p>
                          </div>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {fmtCur(card.used)} / {fmtCur(card.credit_limit)}
                          </p>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width:      `${card.percent}%`,
                              background: card.percent > 80 ? '#f87171' : card.percent > 50 ? '#fbbf24' : card.color ?? '#6ee7b7',
                            }}
                          />
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {card.percent}% utilizado · {fmtCur(card.available)} disponivel
                        </p>
                      </div>
                    ))}
                  </div>
                  <DataTable
                    columns={[
                      { key: 'name',         label: 'Cartao'      },
                      { key: 'credit_limit', label: 'Limite',     align: 'right' },
                      { key: 'used',         label: 'Utilizado',  align: 'right' },
                      { key: 'available',    label: 'Disponivel', align: 'right' },
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
              title="Projecao financeira"
              subtitle="Saldo projetado para os proximos 3 meses com base na media historica"
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.projection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line dataKey="projected_income"  name="Receita proj."  stroke={chartColors.income}     strokeWidth={2} dot={false} />
                  <Line dataKey="projected_expense" name="Despesa proj."  stroke={chartColors.expense}    strokeWidth={2} dot={false} />
                  <Line dataKey="projected_balance" name="Saldo proj."    stroke={chartColors.balance}    strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>

              <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
                Baseado na media dos ultimos 3 meses
              </p>

              <DataTable
                columns={[
                  { key: 'label',             label: 'Mes'      },
                  { key: 'projected_income',  label: 'Receita',  align: 'right' },
                  { key: 'projected_expense', label: 'Despesa',  align: 'right' },
                  { key: 'projected_balance', label: 'Saldo',    align: 'right' },
                  { key: 'is_projection',     label: 'Tipo',     align: 'right' },
                ]}
                rows={data.projection as unknown as Record<string, unknown>[]}
                formatValue={(k, v) => {
                  if (['projected_income','projected_expense','projected_balance'].includes(k))
                    return fmtCur(Number(v))
                  if (k === 'is_projection') return v ? 'Projecao' : 'Real'
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
