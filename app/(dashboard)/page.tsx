import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import DashboardClient from '@/app/(dashboard)/DashboardClient'
import { getCoupleProfileServer, getDashboardServer, getNotificationsServer } from '@/lib/serverQueries'

export default async function DashboardPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['dashboard'],
      queryFn: getDashboardServer,
    }),
    queryClient.prefetchQuery({
      queryKey: ['notifications'],
      queryFn: () => getNotificationsServer(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['couple'],
      queryFn: getCoupleProfileServer,
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  )
}
