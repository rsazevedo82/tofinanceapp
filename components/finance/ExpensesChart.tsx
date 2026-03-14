'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils/format'

interface ExpenseData {
  category_id: string
  category_name: string
  category_color: string | null
  total: number
}

const FALLBACK_COLORS = [
  '#6366f1','#22c55e','#ef4444','#f59e0b',
  '#14b8a6','#ec4899','#8b5cf6','#f97316',
]

export function ExpensesChart({ data }: { data: ExpenseData[] }) {
  if (data.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-8">
        Nenhum gasto registrado este mês
      </p>
    )
  }

  const chartData = data.map((item, i) => ({
    name: item.category_name,
    value: item.total,
    color: item.category_color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            color: '#f1f5f9',
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}