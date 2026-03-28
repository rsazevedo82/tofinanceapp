'use client'

interface CardInvoiceMockupProps {
  cardName?: string
  limit?: number
  used?: number
  closingDay?: number
  dueDay?: number
  className?: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function CardInvoiceMockup({
  cardName = 'Cartao Principal',
  limit = 3200,
  used = 1180,
  closingDay = 10,
  dueDay = 17,
  className = '',
}: CardInvoiceMockupProps) {
  const normalizedLimit = Math.max(limit, 1)
  const normalizedUsed = Math.max(0, Math.min(used, normalizedLimit))
  const available = Math.max(0, normalizedLimit - normalizedUsed)
  const usedPercent = Math.min(100, (normalizedUsed / normalizedLimit) * 100)

  const progressColor =
    usedPercent >= 80 ? '#EF4444' : usedPercent >= 55 ? '#F59E0B' : '#2DD4BF'

  return (
    <div className={`rounded-2xl border border-[#E5E7EB] bg-white p-3 text-left ${className}`}>
      <div
        className="rounded-xl p-3 text-white"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 56%, #334155 100%)',
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-white/70">Cartao</p>
            <p className="text-sm font-semibold mt-0.5">{cardName}</p>
          </div>
          <div className="h-8 w-10 rounded-md bg-white/20" />
        </div>
        <p className="mt-4 text-xs text-white/80">Fecha dia {closingDay} · Vence dia {dueDay}</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <p className="data-label mb-1">Limite</p>
          <p className="text-xs font-semibold text-[#0F172A]">{formatCurrency(normalizedLimit)}</p>
        </div>
        <div>
          <p className="data-label mb-1">Fatura</p>
          <p className="text-xs font-semibold text-[#D97706]">{formatCurrency(normalizedUsed)}</p>
        </div>
        <div>
          <p className="data-label mb-1">Disponivel</p>
          <p className="text-xs font-semibold text-[#0F766E]">{formatCurrency(available)}</p>
        </div>
      </div>

      <div className="mt-2 h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
        <div
          className="h-full rounded-full motion-progress"
          style={{
            width: `${usedPercent}%`,
            background: `linear-gradient(90deg, ${progressColor} 0%, ${progressColor} 65%, ${progressColor} 100%)`,
          }}
        />
      </div>
      <p className="text-[11px] text-[#475569] mt-1">{usedPercent.toFixed(0)}% do limite utilizado</p>
    </div>
  )
}

