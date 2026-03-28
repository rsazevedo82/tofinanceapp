import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import ObjetivosClient from '@/app/(dashboard)/objetivos/ObjetivosClient'
import { goalKeys } from '@/hooks/useGoals'
import { fetchServerApi } from '@/lib/serverApi'
import type { CoupleProfile, Goal } from '@/types'

export default async function ObjetivosPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['couple'],
      queryFn: () => fetchServerApi<CoupleProfile | null>('/api/couple'),
    }),
    queryClient.prefetchQuery({
      queryKey: goalKeys.list('individual'),
      queryFn: () => fetchServerApi<Goal[]>('/api/goals?scope=individual'),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ObjetivosClient />
    </HydrationBoundary>
  )
}
