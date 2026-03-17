import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Transaction, ApiResponse } from '@/types'

export function useTransactions(params?: {
  start?: string
  end?: string
  account_id?: string
}) {
  const searchParams = new URLSearchParams()
  if (params?.start)      searchParams.set('start', params.start)
  if (params?.end)        searchParams.set('end', params.end)
  if (params?.account_id) searchParams.set('account_id', params.account_id)

  const query = searchParams.toString()

  return useQuery({
    queryKey: ['transactions', params],
    queryFn: async (): Promise<Transaction[]> => {
      const res = await fetch(`/api/transactions${query ? `?${query}` : ''}`)
      const json: ApiResponse<Transaction[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json: ApiResponse<Transaction> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      // Criar sempre afeta saldo — invalida tudo
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json: ApiResponse<Transaction> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: (_, variables) => {
      // Sempre invalida a lista de transações
      queryClient.invalidateQueries({ queryKey: ['transactions'] })

      // Invalida contas e dashboard apenas se o saldo pode ter mudado
      const affectsBalance =
        variables.body.amount     !== undefined ||
        variables.body.type       !== undefined ||
        variables.body.account_id !== undefined ||
        variables.body.status     !== undefined

      if (affectsBalance) {
        queryClient.invalidateQueries({ queryKey: ['accounts'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      const json: ApiResponse<null> = await res.json()
      if (json.error) throw new Error(json.error)
    },
    onSuccess: () => {
      // Deletar sempre afeta saldo — invalida tudo
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}