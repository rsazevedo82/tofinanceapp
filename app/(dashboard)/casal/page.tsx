import type { Metadata } from 'next'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import CasalClient from '@/app/(dashboard)/casal/CasalClient'
import { getCoupleProfileServer, getNotificationsServer, getPendingInviteServer } from '@/lib/serverQueries'
import { buildSocialMetadata } from '@/lib/socialMeta'

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
      queryFn: getCoupleProfileServer,
    }),
    queryClient.prefetchQuery({
      queryKey: ['couple', 'pending-invite'],
      queryFn: getPendingInviteServer,
    }),
    queryClient.prefetchQuery({
      queryKey: ['notifications'],
      queryFn: () => getNotificationsServer(),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CasalClient />
    </HydrationBoundary>
  )
}
