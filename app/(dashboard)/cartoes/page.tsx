import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import CartoesClient from '@/app/(dashboard)/cartoes/CartoesClient'
import { fetchServerApi } from '@/lib/serverApi'
import type { Account, CoupleProfile, CreditInvoice } from '@/types'

export default async function CartoesPage() {
  const queryClient = new QueryClient()

  const [, accounts] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: ['couple'],
      queryFn: () => fetchServerApi<CoupleProfile | null>('/api/couple'),
    }),
    queryClient.fetchQuery({
      queryKey: ['accounts', 'me'],
      queryFn: () => fetchServerApi<Account[]>('/api/accounts'),
    }),
  ])

  const creditCards = accounts.filter(a => a.type === 'credit' && a.is_active)
  await Promise.all(
    creditCards.map(card =>
      queryClient.prefetchQuery({
        queryKey: ['invoices', card.id],
        queryFn: () => fetchServerApi<CreditInvoice[]>(`/api/invoices?account_id=${card.id}`),
      }),
    ),
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CartoesClient />
    </HydrationBoundary>
  )
}
