import { useQuery } from '@tanstack/react-query'
import type { Category, ApiResponse } from '@/types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const res = await fetch('/api/categories')
      const json: ApiResponse<Category[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
    staleTime: 1000 * 60 * 5, // categorias mudam pouco — cache de 5 minutos
  })
}