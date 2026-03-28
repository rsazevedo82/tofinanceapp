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
            <p className="text-xs mt-0.5 text-[#334155]">{subtitle}</p>
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
  mobilePrimaryKey?: string
  mobilePriorityKeys?: string[]
  mobileHiddenKeys?: string[]
}

export function DataTable({
  columns,
  rows,
  formatValue,
  mobilePrimaryKey,
  mobilePriorityKeys = [],
  mobileHiddenKeys = [],
}: DataTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-xs text-center py-4 text-[#334155]">
        Sem dados para exibir
      </p>
    )
  }

  const primaryKey = mobilePrimaryKey ?? columns[0]?.key
  const mobileColumns = columns.filter(col => col.key !== primaryKey && !mobileHiddenKeys.includes(col.key))
  const orderedMobileColumns = [
    ...mobileColumns.filter(col => mobilePriorityKeys.includes(col.key)),
    ...mobileColumns.filter(col => !mobilePriorityKeys.includes(col.key)),
  ]

  return (
    <div>
      <div className="md:hidden space-y-2">
        {rows.map((row, i) => {
          const primaryColumn = columns.find(col => col.key === primaryKey)
          const primaryValue = primaryColumn
            ? (formatValue ? formatValue(primaryColumn.key, row[primaryColumn.key] ?? null) : String(row[primaryColumn.key] ?? '—'))
            : `Item ${i + 1}`

          return (
            <div key={i} className="rounded-xl bg-white px-3 py-3" style={{ border: '1px solid #D1D5DB' }}>
              <p className="text-sm font-semibold text-[#0F172A] mb-2 leading-snug">
                {primaryValue}
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {orderedMobileColumns.map(col => (
                  <div key={col.key}>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#64748B] font-semibold">
                      {col.label}
                    </p>
                    <p className={`text-sm ${col.align === 'right' ? 'text-right' : 'text-left'} text-[#0F172A]`}>
                      {formatValue
                        ? formatValue(col.key, row[col.key] ?? null)
                        : String(row[col.key] ?? '—')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid #D1D5DB' }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`pb-2 font-medium ${col.align === 'right' ? 'text-right' : 'text-left'} text-[#334155]`}
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
    </div>
  )
}

