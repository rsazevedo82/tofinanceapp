// components/reports/ChartCard.tsx
// Wrapper padrao para todos os graficos de relatorio
'use client'

import type { ReactNode } from 'react'

interface ChartCardProps {
  title:    string
  subtitle?: string
  children: ReactNode
  action?:  ReactNode
}

export function ChartCard({ title, subtitle, children, action }: ChartCardProps) {
  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
          {subtitle && (
            <p className="text-xs mt-0.5 text-[#6B7280]">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Tabela de dados generica ──────────────────────────────────────────────────

type TableRow = Record<string, unknown>

interface DataTableProps {
  columns: { key: string; label: string; align?: 'left' | 'right' }[]
  rows:    TableRow[]
  formatValue?: (key: string, value: unknown) => string
}

export function DataTable({ columns, rows, formatValue }: DataTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-xs text-center py-4 text-[#6B7280]">
        Sem dados para exibir
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: '1px solid #D1D5DB' }}>
            {columns.map(col => (
              <th
                key={col.key}
                className={`pb-2 font-medium ${col.align === 'right' ? 'text-right' : 'text-left'} text-[#6B7280]`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ borderBottom: '1px solid rgba(209,213,219,0.5)' }}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`py-1.5 text-[#0F172A] ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {formatValue
                    ? formatValue(col.key, row[col.key] ?? null)
                    : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
