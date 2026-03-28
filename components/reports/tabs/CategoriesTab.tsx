'use client'

import { ChartCard, DataTable } from '@/components/reports/ChartCard'
import { CustomTooltip, fmtCur } from '@/components/reports/reportShared'
import { c } from '@/lib/utils/copy'
import type { ReportsPayload } from '@/types'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface CategoriesTabProps {
  data: ReportsPayload
  isCouple: boolean
}

export default function CategoriesTab({ data, isCouple }: CategoriesTabProps) {
  return (
    <ChartCard title="Gastos por categoria" subtitle={`Despesas de ${data.period.month}`}>
      {data.categories.length === 0 ? (
        <p className="text-xs text-center py-8 text-[#334155]">
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
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {data.categories.map((entry, i) => (
                  <Cell key={i} fill={entry.category_color ?? `hsl(${i * 40}, 60%, 55%)`} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: '#334155', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
          <DataTable
            columns={[
              { key: 'category_name', label: 'Categoria' },
              { key: 'count', label: 'Qtd', align: 'right' },
              { key: 'total', label: 'Total', align: 'right' },
              { key: 'percent', label: '%', align: 'right' },
            ]}
            rows={data.categories as unknown as Record<string, unknown>[]}
            mobilePrimaryKey="category_name"
            mobilePriorityKeys={['total', 'percent']}
            formatValue={(k, v) => {
              if (k === 'total') return fmtCur(Number(v))
              if (k === 'percent') return `${v}%`
              return String(v ?? '—')
            }}
          />
        </>
      )}
    </ChartCard>
  )
}

