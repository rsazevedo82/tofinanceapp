import { useQuery } from '@tanstack/react-query'
import type { ApiResponse, CardOverviewItem } from '@/types'

export const CARDS_OVERVIEW_KEY = ['cards', 'overview'] as const

export function useCardsOverview() {
  return useQuery({
    queryKey: CARDS_OVERVIEW_KEY,
    queryFn: async (): Promise<CardOverviewItem[]> => {
      const res = await fetch('/api/cards/overview')
      const json: ApiResponse<CardOverviewItem[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })
}
