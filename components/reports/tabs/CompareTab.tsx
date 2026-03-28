'use client'

import { useMemo } from 'react'
import { ChartCard } from '@/components/reports/ChartCard'
import { chartColors, CustomTooltip, fmtCur, SeriesLegend } from '@/components/reports/reportShared'
import type { ReportsPayload } from '@/types'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface CompareTabProps {
  data: ReportsPayload
  isCouple: boolean
}

export default function CompareTab({ data }: CompareTabProps) {
  const comparison = useMemo(() => {
    if (data.monthly.length < 2) return null

    const cur = data.monthly[data.monthly.length - 1]
    const prev = data.monthly[data.monthly.length - 2]

    return { cur, prev }
  }, [data.monthly])

  const chartData = useMemo(() => data.monthly.slice(-3), [data.monthly])

  return (
    <ChartCard title="Comparativo mensal" subtitle="Mês atual vs mês anterior">
      {!comparison ? (
        <p className="text-xs text-center py-8 text-[#334155]">
          Dados insuficientes para comparativo
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(['income', 'expense'] as const).map(type => {
              const cur = comparison.cur
              const prev = comparison.prev
              const curV = cur[type]
              const prevV = prev[type]
              const diff = curV - prevV
              const pct = prevV > 0 ? ((diff / prevV) * 100).toFixed(1) : '—'
              const isGood = type === 'income' ? diff >= 0 : diff <= 0
              const movement = diff === 0 ? 'Sem variação' : diff > 0 ? 'Aumentou' : 'Reduziu'
              const movementIcon = diff === 0 ? '→' : diff > 0 ? '↑' : '↓'
              return (
                <div key={type} className="p-3 rounded-xl bg-white" style={{ border: '1px solid #D1D5DB' }}>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: type === 'income' ? '#2DD4BF' : '#FF7F50' }}>
                    {type === 'income' ? 'Receitas' : 'Despesas'}
                  </p>
                  <p className="text-base font-black text-[#0F172A]">{fmtCur(curV)}</p>
                  <p className="text-xs mt-1 text-[#334155]">Anterior: {fmtCur(prevV)}</p>
                  {prevV > 0 ? (
                    <p className="text-xs font-semibold mt-0.5" style={{ color: isGood ? '#2DD4BF' : '#FF7F50' }}>
                      {movementIcon} {movement} ({diff >= 0 ? '+' : ''}{pct}%)
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
              <XAxis dataKey="label" tick={{ fill: '#334155', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#334155', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="↑ Receitas" fill={chartColors.income} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="↓ Despesas" fill={chartColors.expense} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <SeriesLegend
            items={[
              { symbol: '↑', label: 'Receitas' },
              { symbol: '↓', label: 'Despesas' },
            ]}
          />
        </>
      )}
    </ChartCard>
  )
}

