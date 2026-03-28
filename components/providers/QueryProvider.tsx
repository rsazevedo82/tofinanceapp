'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState }                          from 'react'
import { PartnerViewProvider }               from '@/components/providers/PartnerViewProvider'
import { ToastProvider }                     from '@/components/providers/ToastProvider'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PartnerViewProvider>
          {children}
        </PartnerViewProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
