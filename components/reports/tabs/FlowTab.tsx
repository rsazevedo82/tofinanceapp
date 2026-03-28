'use client'

import { useMemo } from 'react'
import { ChartCard, DataTable } from '@/components/reports/ChartCard'
import { chartColors, CustomTooltip, fmtCur, SeriesLegend } from '@/components/reports/reportShared'
import type { ReportsPayload } from '@/types'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface FlowTabProps {
  data: ReportsPayload
  isCouple: boolean
}

export default function FlowTab({ data }: FlowTabProps) {
  const rowsWithMovement = useMemo(
    () => data.daily_flow.filter(d => d.income > 0 || d.expense > 0),
    [data.daily_flow]
  )

  return (
    <ChartCard title="Fluxo de caixa diário" subtitle={`Entradas, saídas e saldo acumulado em ${data.period.month}`}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data.daily_flow}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
          <XAxis dataKey="label" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
          <YAxis
            tick={{ fill: '#334155', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line dataKey="income" name="↑ Entrada" stroke={chartColors.income} dot={false} strokeWidth={2} />
          <Line dataKey="expense" name="↓ Saída" stroke={chartColors.expense} dot={false} strokeWidth={2} />
          <Line dataKey="balance" name="◆ Saldo acumulado" stroke={chartColors.balance} dot={false} strokeWidth={2} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
      <SeriesLegend
        items={[
          { symbol: '↑', label: 'Entrada' },
          { symbol: '↓', label: 'Saída' },
          { symbol: '◆', label: 'Saldo acumulado (linha tracejada)' },
        ]}
      />
      <DataTable
        columns={[
          { key: 'label', label: 'Dia' },
          { key: 'income', label: 'Entrada', align: 'right' },
          { key: 'expense', label: 'Saída', align: 'right' },
          { key: 'balance', label: 'Acumulado', align: 'right' },
        ]}
        rows={rowsWithMovement as unknown as Record<string, unknown>[]}
        formatValue={(k, v) => (['income', 'expense', 'balance'].includes(k) ? fmtCur(Number(v)) : String(v ?? '—'))}
      />
    </ChartCard>
  )
}

