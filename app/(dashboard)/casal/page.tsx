import type { Metadata } from 'next'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import CasalClient from '@/app/(dashboard)/casal/CasalClient'
import { fetchServerApi } from '@/lib/serverApi'
import { buildSocialMetadata } from '@/lib/socialMeta'
import type { CoupleInvitation, CoupleProfile, Notification } from '@/types'

export const metadata: Metadata = {
  title: 'Conexão do Casal | Nós 2 Reais',
  description: 'Convites e vínculo do casal para organizar finanças juntos com mais transparência.',
  ...buildSocialMetadata({
    title: 'Conexão do Casal | Nós 2 Reais',
    description: 'Convites e vínculo do casal para organizar finanças juntos com mais transparência.',
    imagePath: '/social/og-casal.svg',
    imageAlt: 'Conexão do casal no Nós 2 Reais',
  }),
}

export default async function CasalPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['couple'],
      queryFn: () => fetchServerApi<CoupleProfile | null>('/api/couple'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['couple', 'pending-invite'],
      queryFn: () => fetchServerApi<CoupleInvitation | null>('/api/couple/invite/pending'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['notifications'],
      queryFn: () => fetchServerApi<Notification[]>('/api/notifications'),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CasalClient />
    </HydrationBoundary>
  )
}
