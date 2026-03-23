// components/ui/PartnerViewToggle.tsx
'use client'

import { usePartnerView } from '@/components/providers/PartnerViewProvider'
import { useCouple }      from '@/hooks/useCouple'

export function PartnerViewToggle() {
  const { data: couple } = useCouple()
  const { isViewingPartner, togglePartnerView } = usePartnerView()

  if (!couple) return null

  const partnerName = couple.partner?.name ?? 'Parceiro'
  const initial     = partnerName.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.07)' }}>

      {/* Meu perfil */}
      <button
        onClick={() => isViewingPartner && togglePartnerView()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: !isViewingPartner ? 'rgba(255,255,255,0.08)' : 'transparent',
          color:      !isViewingPartner ? '#e8e6e1' : 'rgba(200,198,190,0.45)',
          border:     !isViewingPartner ? '0.5px solid rgba(255,255,255,0.12)' : '0.5px solid transparent',
        }}
      >
        <span className="text-[11px]">👤</span>
        Eu
      </button>

      {/* Perfil do parceiro */}
      <button
        onClick={() => !isViewingPartner && togglePartnerView()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: isViewingPartner ? 'rgba(129,140,248,0.15)' : 'transparent',
          color:      isViewingPartner ? '#818cf8' : 'rgba(200,198,190,0.45)',
          border:     isViewingPartner ? '0.5px solid rgba(129,140,248,0.3)' : '0.5px solid transparent',
        }}
      >
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
          style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8' }}>
          {initial}
        </span>
        {partnerName}
      </button>
    </div>
  )
}
