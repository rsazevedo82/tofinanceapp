// components/ui/PartnerViewBanner.tsx
'use client'

import { usePartnerView } from '@/components/providers/PartnerViewProvider'

export function PartnerViewBanner() {
  const { isViewingPartner, partnerName, linkedAt, exitPartnerView } = usePartnerView()

  if (!isViewingPartner) return null

  const linkedDate = linkedAt
    ? new Date(linkedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 mb-6 rounded-xl text-xs"
      style={{
        background: 'rgba(129,140,248,0.08)',
        border:     '0.5px solid rgba(129,140,248,0.25)',
      }}
    >
      <div className="flex items-center gap-2">
        <span>👁</span>
        <span style={{ color: '#818cf8' }}>
          Visualizando dados de <strong>{partnerName}</strong>
          {linkedDate && (
            <span style={{ color: 'rgba(129,140,248,0.6)' }}> · a partir de {linkedDate}</span>
          )}
        </span>
      </div>
      <button
        onClick={exitPartnerView}
        className="text-[10px] px-2.5 py-1 rounded-lg transition-colors"
        style={{ color: 'rgba(129,140,248,0.7)', background: 'rgba(129,140,248,0.1)' }}
      >
        Voltar para meus dados
      </button>
    </div>
  )
}
