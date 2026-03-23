// hooks/useCouple.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiResponse, CoupleProfile, CoupleInvitation } from '@/types'

// ── Leitura ───────────────────────────────────────────────────────────────────

export function useCouple() {
  return useQuery({
    queryKey: ['couple'],
    queryFn:  async (): Promise<CoupleProfile | null> => {
      const res  = await fetch('/api/couple')
      const json: ApiResponse<CoupleProfile | null> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? null
    },
    staleTime: 1000 * 60,
  })
}

// ── Enviar convite ────────────────────────────────────────────────────────────

export function useSendInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (email: string): Promise<CoupleInvitation> => {
      const res  = await fetch('/api/couple/invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const json: ApiResponse<CoupleInvitation> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] })
    },
  })
}

// ── Aceitar ou rejeitar convite ───────────────────────────────────────────────

export function useRespondInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ token, action }: { token: string; action: 'accept' | 'reject' }) => {
      const res  = await fetch(`/api/couple/invite/${token}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      })
      const json: ApiResponse<null> = await res.json()
      if (json.error) throw new Error(json.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// ── Desvincular ───────────────────────────────────────────────────────────────

export function useUnlinkCouple() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (password: string) => {
      const res  = await fetch('/api/couple', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      })
      const json: ApiResponse<null> = await res.json()
      if (json.error) throw new Error(json.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
