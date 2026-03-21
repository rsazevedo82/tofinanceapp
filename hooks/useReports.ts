// hooks/useReports.ts
import { useQuery }                from '@tanstack/react-query'
import type { ApiResponse }        from '@/types'
import type { ReportsPayload }     from '@/app/api/reports/route'

export function useReports(month: string) {
  return useQuery({
    queryKey:  ['reports', month],
    queryFn:   async (): Promise<ReportsPayload> => {
      const res  = await fetch(`/api/reports?month=${month}`)
      const json: ApiResponse<ReportsPayload> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data!
    },
    staleTime: 1000 * 60 * 2,   // 2 minutos de cache
  })
}