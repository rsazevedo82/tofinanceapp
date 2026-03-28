import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import CasalClient from '@/app/(dashboard)/casal/CasalClient'
import { fetchServerApi } from '@/lib/serverApi'
import type { CoupleInvitation, CoupleProfile, Notification } from '@/types'

export default async function CasalPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['couple'],
      queryFn: () => fetchServerApi<CoupleProfile | null>('/api/couple'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['couple', 'pending-invite'],
      queryFn: () => fetchServerApi<CoupleInvitation | null>('/api/couple/invite/pending'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['notifications'],
      queryFn: () => fetchServerApi<Notification[]>('/api/notifications'),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CasalClient />
    </HydrationBoundary>
  )
}
