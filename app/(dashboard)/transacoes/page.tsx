import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import TransacoesClient from '@/app/(dashboard)/transacoes/TransacoesClient'
import { fetchServerApi } from '@/lib/serverApi'
import type { CoupleProfile, Transaction } from '@/types'

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

export default async function TransacoesPage() {
  const queryClient = new QueryClient()
  const selectedMonth = getCurrentMonthInSaoPaulo()
  const [year, month] = selectedMonth.split('-').map(Number)

  const start = `${selectedMonth}-01`
  const end = new Date(year, month, 0).toISOString().split('T')[0]

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['couple'],
      queryFn: () => fetchServerApi<CoupleProfile | null>('/api/couple'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['transactions', { start, end }],
      queryFn: () => fetchServerApi<Transaction[]>(`/api/transactions?start=${start}&end=${end}`),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransacoesClient />
    </HydrationBoundary>
  )
}
