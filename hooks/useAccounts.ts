// hooks/useAccounts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Account, ApiResponse } from '@/types'

// ── Buscar todas as contas ────────────────────────────────────────────────────

export function useAccounts(userId?: string) {
  const url = userId ? `/api/accounts?user_id=${userId}` : '/api/accounts'
  return useQuery({
    queryKey: ['accounts', userId ?? 'me'],
    queryFn: async (): Promise<Account[]> => {
      const res = await fetch(url)
      const json: ApiResponse<Account[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })
}

// ── Criar conta ───────────────────────────────────────────────────────────────

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json: ApiResponse<Account> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['cards', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ── Atualizar conta ───────────────────────────────────────────────────────────

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json: ApiResponse<Account> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['cards', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ── Excluir conta ─────────────────────────────────────────────────────────────

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password?: string }) => {
      const res = await fetch(`/api/accounts/${id}`, {
        method:  'DELETE',
        headers: password ? { 'Content-Type': 'application/json' } : undefined,
        body:    password ? JSON.stringify({ password }) : undefined,
      })
      const json: ApiResponse<null> = await res.json()
      if (json.error) throw new Error(json.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['cards', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
