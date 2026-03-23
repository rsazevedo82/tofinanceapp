// hooks/useGoals.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Goal, GoalContribution, ApiResponse } from '@/types'
import type { CreateGoalInput, UpdateGoalInput, AddContributionInput } from '@/lib/validations/schemas'

// ── Keys ──────────────────────────────────────────────────────────────────────

export const goalKeys = {
  all:           ['goals'] as const,
  list:          (scope?: string) => ['goals', 'list', scope ?? 'all'] as const,
  detail:        (id: string)     => ['goals', 'detail', id] as const,
  contributions: (id: string)     => ['goals', 'contributions', id] as const,
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchGoals(scope?: string): Promise<Goal[]> {
  const url = scope && scope !== 'all' ? `/api/goals?scope=${scope}` : '/api/goals'
  const res  = await fetch(url)
  const json: ApiResponse<Goal[]> = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao carregar metas')
  return json.data ?? []
}

async function fetchContributions(goalId: string): Promise<GoalContribution[]> {
  const res  = await fetch(`/api/goals/${goalId}/contributions`)
  const json: ApiResponse<GoalContribution[]> = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao carregar aportes')
  return json.data ?? []
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useGoals(scope?: 'individual' | 'couple' | 'all') {
  return useQuery({
    queryKey:  goalKeys.list(scope),
    queryFn:   () => fetchGoals(scope),
    staleTime: 30_000,
  })
}

export function useGoalContributions(goalId: string) {
  return useQuery({
    queryKey:  goalKeys.contributions(goalId),
    queryFn:   () => fetchContributions(goalId),
    enabled:   !!goalId,
    staleTime: 15_000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateGoal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const res  = await fetch('/api/goals', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      })
      const json: ApiResponse<Goal> = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao criar meta')
      return json.data!
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}

export function useUpdateGoal(goalId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateGoalInput) => {
      const res  = await fetch(`/api/goals/${goalId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      })
      const json: ApiResponse<Goal> = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao atualizar meta')
      return json.data!
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (goalId: string) => {
      const res  = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
      const json: ApiResponse<null> = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao arquivar meta')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}

export function useAddContribution(goalId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddContributionInput) => {
      const res  = await fetch(`/api/goals/${goalId}/contributions`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      })
      const json: ApiResponse<GoalContribution> = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao adicionar aporte')
      return json.data!
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.contributions(goalId) })
      qc.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}

export function useDeleteContribution(goalId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (contributionId: string) => {
      const res  = await fetch(`/api/goals/${goalId}/contributions/${contributionId}`, { method: 'DELETE' })
      const json: ApiResponse<null> = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao remover aporte')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.contributions(goalId) })
      qc.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}
