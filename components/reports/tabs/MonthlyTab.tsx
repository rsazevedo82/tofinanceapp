'use client'

import { ChartCard, DataTable } from '@/components/reports/ChartCard'
import { chartColors, CustomTooltip, fmtCur, SeriesLegend } from '@/components/reports/reportShared'
import type { ReportsPayload } from '@/types'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface MonthlyTabProps {
  data: ReportsPayload
  isCouple: boolean
}

export default function MonthlyTab({ data }: MonthlyTabProps) {
  return (
    <ChartCard title="Evolução mensal" subtitle="Receitas e despesas dos últimos 6 meses">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data.monthly} barGap={4}>
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
      <DataTable
        columns={[
          { key: 'label', label: 'Mês' },
          { key: 'income', label: 'Receitas', align: 'right' },
          { key: 'expense', label: 'Despesas', align: 'right' },
          { key: 'net', label: 'Saldo', align: 'right' },
        ]}
        rows={data.monthly as unknown as Record<string, unknown>[]}
        formatValue={(k, v) => (['income', 'expense', 'net'].includes(k) ? fmtCur(Number(v)) : String(v ?? '—'))}
      />
    </ChartCard>
  )
}

