import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import TransacoesClient from '@/app/(dashboard)/transacoes/TransacoesClient'
import { getCoupleProfileServer } from '@/lib/serverQueries'

export default async function TransacoesPage() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['couple'],
    queryFn: getCoupleProfileServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransacoesClient />
    </HydrationBoundary>
  )
}
