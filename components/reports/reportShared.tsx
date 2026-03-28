'use client'

import { formatCurrency } from '@/lib/utils/format'

export function fmtCur(v: number) {
  return formatCurrency(v)
}

interface TooltipEntry {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg text-xs shadow-xl bg-white" style={{ border: '1px solid #D1D5DB' }}>
      <p className="font-semibold text-[#0F172A] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtCur(p.value)}
        </p>
      ))}
    </div>
  )
}

interface SeriesLegendItem {
  label: string
  symbol: string
}

export function SeriesLegend({ items }: { items: SeriesLegendItem[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
      {items.map((item) => (
        <p key={item.label} className="text-xs text-[#334155]">
          <span className="font-semibold text-[#0F172A] mr-1">{item.symbol}</span>
          {item.label}
        </p>
      ))}
    </div>
  )
}

export const chartColors = {
  income: '#2DD4BF',
  expense: '#FF7F50',
  balance: '#334155',
  projection: '#F59E0B',
} as const

