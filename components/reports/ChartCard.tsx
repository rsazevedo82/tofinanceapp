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
          <p className="text-sm font-semibold text-[#e8e6e1]">{title}</p>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: 'rgba(200,198,190,0.4)' }}>{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Tabela de dados generica ──────────────────────────────────────────────────

interface TableRow { [key: string]: string | number | null }

interface DataTableProps {
  columns: { key: string; label: string; align?: 'left' | 'right' }[]
  rows:    TableRow[]
  formatValue?: (key: string, value: string | number | null) => string
}

export function DataTable({ columns, rows, formatValue }: DataTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: 'rgba(200,198,190,0.3)' }}>
        Sem dados para exibir
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
            {columns.map(col => (
              <th
                key={col.key}
                className={`pb-2 font-medium ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                style={{ color: 'rgba(200,198,190,0.4)' }}
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
              style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`py-1.5 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  style={{ color: '#c8c6be' }}
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