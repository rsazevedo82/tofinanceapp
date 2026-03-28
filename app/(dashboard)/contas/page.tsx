import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import ContasClient from '@/app/(dashboard)/contas/ContasClient'
import { getAccountsServer, getCoupleProfileServer } from '@/lib/serverQueries'

export default async function ContasPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['couple'],
      queryFn: getCoupleProfileServer,
    }),
    queryClient.prefetchQuery({
      queryKey: ['accounts', 'me'],
      queryFn: () => getAccountsServer(),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContasClient />
    </HydrationBoundary>
  )
}
