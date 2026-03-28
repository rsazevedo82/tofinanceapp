import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import ObjetivosClient from '@/app/(dashboard)/objetivos/ObjetivosClient'
import { goalKeys } from '@/hooks/useGoals'
import { getCoupleProfileServer, getGoalsServer } from '@/lib/serverQueries'

export default async function ObjetivosPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['couple'],
      queryFn: getCoupleProfileServer,
    }),
    queryClient.prefetchQuery({
      queryKey: goalKeys.list('individual'),
      queryFn: () => getGoalsServer('individual'),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ObjetivosClient />
    </HydrationBoundary>
  )
}
