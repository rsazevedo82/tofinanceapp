import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import CartoesClient from '@/app/(dashboard)/cartoes/CartoesClient'
import { fetchServerApi } from '@/lib/serverApi'
import { CARDS_OVERVIEW_KEY } from '@/hooks/useCardsOverview'
import type { CardOverviewItem, CoupleProfile } from '@/types'

export default async function CartoesPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.fetchQuery({
      queryKey: ['couple'],
      queryFn: () => fetchServerApi<CoupleProfile | null>('/api/couple'),
    }),
    queryClient.fetchQuery({
      queryKey: CARDS_OVERVIEW_KEY,
      queryFn: () => fetchServerApi<CardOverviewItem[]>('/api/cards/overview'),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CartoesClient />
    </HydrationBoundary>
  )
}
