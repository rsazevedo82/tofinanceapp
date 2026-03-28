import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import PerfilClient from '@/app/(dashboard)/perfil/PerfilClient'
import { getProfileServer } from '@/lib/serverQueries'

export default async function PerfilPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['profile'],
    queryFn: getProfileServer,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PerfilClient />
    </HydrationBoundary>
  )
}
