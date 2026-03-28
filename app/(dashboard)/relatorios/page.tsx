import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import RelatoriosClient from '@/app/(dashboard)/relatorios/RelatoriosClient'
import { getCoupleProfileServer, getReportsServer } from '@/lib/serverQueries'

function getCurrentMonthInSaoPaulo() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find(p => p.type === 'year')?.value ?? '1970'
  const month = parts.find(p => p.type === 'month')?.value ?? '01'
  return `${year}-${month}`
}

export default async function RelatoriosPage() {
  const queryClient = new QueryClient()
  const month = getCurrentMonthInSaoPaulo()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['couple'],
      queryFn: getCoupleProfileServer,
    }),
    queryClient.prefetchQuery({
      queryKey: ['reports', month],
      queryFn: () => getReportsServer(month),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RelatoriosClient />
    </HydrationBoundary>
  )
}
