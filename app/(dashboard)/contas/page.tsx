import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import ContasClient from '@/app/(dashboard)/contas/ContasClient'
import { fetchServerApi } from '@/lib/serverApi'
import type { Account, CoupleProfile } from '@/types'

export default async function ContasPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['couple'],
      queryFn: () => fetchServerApi<CoupleProfile | null>('/api/couple'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['accounts', 'me'],
      queryFn: () => fetchServerApi<Account[]>('/api/accounts'),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContasClient />
    </HydrationBoundary>
  )
}
