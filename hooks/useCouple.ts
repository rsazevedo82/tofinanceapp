// hooks/useCouple.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiResponse, CoupleProfile, CoupleInvitation } from '@/types'

const PENDING_INVITE_KEY = ['couple', 'pending-invite'] as const

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

// ── Convite pendente enviado ──────────────────────────────────────────────────

export function usePendingInvite() {
  return useQuery({
    queryKey: PENDING_INVITE_KEY,
    queryFn:  async (): Promise<CoupleInvitation | null> => {
      const res  = await fetch('/api/couple/invite/pending')
      const json: ApiResponse<CoupleInvitation | null> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? null
    },
    staleTime: 1000 * 30,
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
      queryClient.invalidateQueries({ queryKey: PENDING_INVITE_KEY })
    },
  })
}

// ── Reenviar convite ──────────────────────────────────────────────────────────

export function useResendInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<CoupleInvitation> => {
      const res  = await fetch('/api/couple/invite/resend', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json: ApiResponse<CoupleInvitation> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_INVITE_KEY })
    },
  })
}

// ── Cancelar convite enviado ──────────────────────────────────────────────────

export function useCancelInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const res  = await fetch('/api/couple/invite/pending', { method: 'DELETE' })
      const json: ApiResponse<null> = await res.json()
      if (json.error) throw new Error(json.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_INVITE_KEY })
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
