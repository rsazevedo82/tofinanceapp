'use client'

import { ChartCard, DataTable } from '@/components/reports/ChartCard'
import { fmtCur } from '@/components/reports/reportShared'
import type { ReportsPayload } from '@/types'

interface CardsTabProps {
  data: ReportsPayload
  isCouple: boolean
}

function getUsageLevel(percent: number) {
  if (percent >= 80) return { label: 'Alto' }
  if (percent >= 50) return { label: 'Médio' }
  return { label: 'Baixo' }
}

export default function CardsTab({ data }: CardsTabProps) {
  return (
    <ChartCard title="Limites dos cartões" subtitle="Uso atual do limite de crédito">
      {data.card_limits.length === 0 ? (
        <p className="text-xs text-center py-8 text-[#334155]">
          Nenhum cartão de crédito cadastrado
        </p>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {data.card_limits.map(card => {
              const usage = getUsageLevel(card.percent)
              return (
                <div key={card.account_id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: card.color ?? '#FF7F50' }} />
                      <p className="text-sm text-[#0F172A]">{card.name}</p>
                      <span className="text-xs text-[#334155]">
                        Uso {usage.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#334155]">
                      {fmtCur(card.used)} / {fmtCur(card.credit_limit)}
                    </p>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-[#E5E7EB]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${card.percent}%`,
                        background: card.percent > 80 ? '#ef4444' : card.percent > 50 ? '#F59E0B' : card.color ?? '#2DD4BF',
                      }}
                    />
                  </div>
                  <p className="text-xs mt-0.5 text-[#334155]">
                    {card.percent}% utilizado · {fmtCur(card.available)} disponível
                  </p>
                </div>
              )
            })}
          </div>
          <DataTable
            columns={[
              { key: 'name', label: 'Cartão' },
              { key: 'credit_limit', label: 'Limite', align: 'right' },
              { key: 'used', label: 'Utilizado', align: 'right' },
              { key: 'available', label: 'Disponível', align: 'right' },
              { key: 'percent', label: '%', align: 'right' },
            ]}
            rows={data.card_limits as unknown as Record<string, unknown>[]}
            formatValue={(k, v) => {
              if (['credit_limit', 'used', 'available'].includes(k)) return fmtCur(Number(v))
              if (k === 'percent') return `${v}%`
              return String(v ?? '—')
            }}
          />
        </>
      )}
    </ChartCard>
  )
}
