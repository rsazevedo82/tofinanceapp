// components/ui/PartnerViewToggle.tsx
'use client'

import { usePartnerView } from '@/components/providers/PartnerViewProvider'
import { useCouple }      from '@/hooks/useCouple'
import { User }           from 'lucide-react'

export function PartnerViewToggle() {
  const { data: couple } = useCouple()
  const { isViewingPartner, togglePartnerView } = usePartnerView()

  if (!couple) return null

  const partnerName = couple.partner?.name ?? 'Parceiro'
  const initial     = partnerName.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F3F4F6] border border-[#D1D5DB]">

      {/* Meu perfil */}
      <button
        onClick={() => isViewingPartner && togglePartnerView()}
        className="touch-target flex items-center gap-1.5 px-3 rounded-lg text-sm font-medium transition-all"
        style={{
          background: !isViewingPartner ? '#ffffff' : 'transparent',
          color:      !isViewingPartner ? '#0F172A' : '#334155',
          border:     !isViewingPartner ? '1px solid #D1D5DB' : '1px solid transparent',
        }}
      >
        <User size={12} aria-hidden />
        Eu
      </button>

      {/* Perfil do parceiro */}
      <button
        onClick={() => !isViewingPartner && togglePartnerView()}
        className="touch-target flex items-center gap-1.5 px-3 rounded-lg text-sm font-medium transition-all"
        style={{
          background: isViewingPartner ? 'rgba(255,127,80,0.1)' : 'transparent',
          color:      isViewingPartner ? '#FF7F50' : '#334155',
          border:     isViewingPartner ? '1px solid rgba(255,127,80,0.3)' : '1px solid transparent',
        }}
      >
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
          style={{ background: 'rgba(255,127,80,0.15)', color: '#FF7F50' }}>
          {initial}
        </span>
        {partnerName}
      </button>
    </div>
  )
}

