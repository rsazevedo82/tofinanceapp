import { useQuery } from '@tanstack/react-query'
import type { Account, ApiResponse } from '@/types'

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async (): Promise<Account[]> => {
      const res = await fetch('/api/accounts')
      const json: ApiResponse<Account[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })
}