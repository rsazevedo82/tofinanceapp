'use client'

import { ChartCard, DataTable } from '@/components/reports/ChartCard'
import { chartColors, CustomTooltip, fmtCur } from '@/components/reports/reportShared'
import type { ReportsPayload } from '@/types'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface ProjectionTabProps {
  data: ReportsPayload
  isCouple: boolean
}

export default function ProjectionTab({ data }: ProjectionTabProps) {
  return (
    <ChartCard title="Projeção financeira" subtitle="Saldo projetado para os próximos 3 meses com base na média histórica">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data.projection}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
          <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line dataKey="projected_income" name="Receita proj." stroke={chartColors.income} strokeWidth={2} dot={false} />
          <Line dataKey="projected_expense" name="Despesa proj." stroke={chartColors.expense} strokeWidth={2} dot={false} />
          <Line dataKey="projected_balance" name="Saldo proj." stroke={chartColors.balance} strokeWidth={2} dot={false} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-[10px] mb-3 text-[#6B7280]">
        Baseado na média dos últimos 3 meses
      </p>

      <DataTable
        columns={[
          { key: 'label', label: 'Mês' },
          { key: 'projected_income', label: 'Receita', align: 'right' },
          { key: 'projected_expense', label: 'Despesa', align: 'right' },
          { key: 'projected_balance', label: 'Saldo', align: 'right' },
          { key: 'is_projection', label: 'Tipo', align: 'right' },
        ]}
        rows={data.projection as unknown as Record<string, unknown>[]}
        formatValue={(k, v) => {
          if (['projected_income', 'projected_expense', 'projected_balance'].includes(k)) return fmtCur(Number(v))
          if (k === 'is_projection') return v ? 'Projeção' : 'Real'
          return String(v ?? '—')
        }}
      />
    </ChartCard>
  )
}
