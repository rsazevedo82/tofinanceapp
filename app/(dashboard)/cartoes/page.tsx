import type { Metadata } from 'next'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import CartoesClient from '@/app/(dashboard)/cartoes/CartoesClient'
import { getCardsOverviewServer, getCoupleProfileServer } from '@/lib/serverQueries'
import { CARDS_OVERVIEW_KEY } from '@/hooks/useCardsOverview'
import { buildSocialMetadata } from '@/lib/socialMeta'

export const metadata: Metadata = {
  title: 'Cartões | Nós 2 Reais',
  description: 'Acompanhe limite, uso e faturas dos cartões com visão clara do disponível.',
  ...buildSocialMetadata({
    title: 'Cartões | Nós 2 Reais',
    description: 'Acompanhe limite, uso e faturas dos cartões com visão clara do disponível.',
    imagePath: '/social/og-cartoes.svg',
    imageAlt: 'Cartões e faturas no Nós 2 Reais',
  }),
}

export default async function CartoesPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.fetchQuery({
      queryKey: ['couple'],
      queryFn: getCoupleProfileServer,
    }),
    queryClient.fetchQuery({
      queryKey: CARDS_OVERVIEW_KEY,
      queryFn: getCardsOverviewServer,
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CartoesClient />
    </HydrationBoundary>
  )
}
