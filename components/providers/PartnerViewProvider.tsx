// components/providers/PartnerViewProvider.tsx
'use client'

import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { useCouple } from '@/hooks/useCouple'

interface PartnerViewContextValue {
  isViewingPartner: boolean
  partnerId:        string | null
  partnerName:      string | null
  linkedAt:         string | null
  togglePartnerView: () => void
  exitPartnerView:   () => void
}

const PartnerViewContext = createContext<PartnerViewContextValue>({
  isViewingPartner:  false,
  partnerId:         null,
  partnerName:       null,
  linkedAt:          null,
  togglePartnerView: () => {},
  exitPartnerView:   () => {},
})

export function PartnerViewProvider({ children }: { children: React.ReactNode }) {
  const [isViewingPartner, setIsViewingPartner] = useState(false)
  const { data: couple } = useCouple()

  const partnerId   = couple?.partner?.id   ?? null
  const partnerName = couple?.partner?.name ?? null
  const linkedAt    = couple?.linked_at     ?? null

  const togglePartnerView = useCallback(() => {
    if (!partnerId) return
    setIsViewingPartner(prev => !prev)
  }, [partnerId])

  const exitPartnerView = useCallback(() => {
    setIsViewingPartner(false)
  }, [])

  // Sai da visão do parceiro se o vínculo for desfeito
  if (!couple && isViewingPartner) {
    setIsViewingPartner(false)
  }

  const value = useMemo(() => ({
    isViewingPartner: isViewingPartner && !!partnerId,
    partnerId,
    partnerName,
    linkedAt,
    togglePartnerView,
    exitPartnerView,
  }), [isViewingPartner, partnerId, partnerName, linkedAt, togglePartnerView, exitPartnerView])

  return (
    <PartnerViewContext.Provider value={value}>
      {children}
    </PartnerViewContext.Provider>
  )
}

export function usePartnerView() {
  return useContext(PartnerViewContext)
}
