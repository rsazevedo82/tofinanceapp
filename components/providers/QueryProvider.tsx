'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState }                          from 'react'
import { PwaAutoUpdate }                     from '@/components/providers/PwaAutoUpdate'
import { ToastProvider }                     from '@/components/providers/ToastProvider'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <PwaAutoUpdate />
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  )
}
