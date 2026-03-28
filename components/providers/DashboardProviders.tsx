'use client'

import { PartnerViewProvider } from '@/components/providers/PartnerViewProvider'

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <PartnerViewProvider>
      {children}
    </PartnerViewProvider>
  )
}
