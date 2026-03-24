// hooks/useSplits.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ExpenseSplit, ApiResponse } from '@/types'
import type { CreateSplitInput } from '@/lib/validations/schemas'

// ── Keys ──────────────────────────────────────────────────────────────────────

export const splitKeys = {
  all:  ['splits'] as const,
  list: (status?: string) => ['splits', 'list', status ?? 'all'] as const,
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchSplits(status?: string): Promise<ExpenseSplit[]> {
  const url  = status && status !== 'all' ? `/api/splits?status=${status}` : '/api/splits'
  const res  = await fetch(url)
  const json: ApiResponse<ExpenseSplit[]> = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao carregar divisões')
  return json.data ?? []
}

// ── Computed: saldo líquido ────────────────────────────────────────────────────
// Retorna quanto o usuário atual deve ao parceiro (positivo = você deve, negativo = parceiro deve)

export function computeBalance(splits: ExpenseSplit[], userId: string): number {
  return splits
    .filter(s => s.status === 'pending')
    .reduce((acc, s) => {
      if (s.payer_id === userId) {
        // Você pagou → parceiro te deve partner_amount
        return acc - s.partner_amount
      } else {
        // Parceiro pagou → você deve partner_amount
        return acc + s.partner_amount
      }
    }, 0)
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useSplits(status?: 'pending' | 'settled' | 'all') {
  return useQuery({
    queryKey:  splitKeys.list(status),
    queryFn:   () => fetchSplits(status),
    staleTime: 30_000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateSplit() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSplitInput) => {
      const res  = await fetch('/api/splits', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      })
      const json: ApiResponse<ExpenseSplit> = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao criar divisão')
      return json.data!
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: splitKeys.all }),
  })
}

export function useSettleSplit() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, settled_at }: { id: string; settled_at: string }) => {
      const res  = await fetch(`/api/splits/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ settled_at }),
      })
      const json: ApiResponse<ExpenseSplit> = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao quitar divisão')
      return json.data!
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: splitKeys.all }),
  })
}

export function useDeleteSplit() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res  = await fetch(`/api/splits/${id}`, { method: 'DELETE' })
      const json: ApiResponse<null> = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao remover divisão')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: splitKeys.all }),
  })
}
