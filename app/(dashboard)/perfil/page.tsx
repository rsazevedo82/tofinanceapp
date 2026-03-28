import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import PerfilClient from '@/app/(dashboard)/perfil/PerfilClient'
import { fetchServerApi } from '@/lib/serverApi'
import type { UserProfile } from '@/types'

export default async function PerfilPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['profile'],
    queryFn: () => fetchServerApi<UserProfile>('/api/profile'),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PerfilClient />
    </HydrationBoundary>
  )
}
