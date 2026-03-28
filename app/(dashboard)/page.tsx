import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import DashboardClient from '@/app/(dashboard)/DashboardClient'
import { fetchServerApi } from '@/lib/serverApi'
import type { Notification, CoupleProfile } from '@/types'
import type { DashboardData } from '@/app/api/dashboard/route'

export default async function DashboardPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['dashboard'],
      queryFn: () => fetchServerApi<DashboardData>('/api/dashboard'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['notifications'],
      queryFn: () => fetchServerApi<Notification[]>('/api/notifications'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['couple'],
      queryFn: () => fetchServerApi<CoupleProfile | null>('/api/couple'),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  )
}
