// hooks/useProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserProfile } from '@/types'
import type { UpdateProfileInput, ChangePasswordInput } from '@/lib/validations/schemas'

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/profile')
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao carregar perfil')
  return json.data
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn:  fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 min
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const res = await fetch('/api/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao salvar')
      return json.data as UserProfile
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data)
      // Atualiza o nome no cache do casal também (sidebar usa useProfile indiretamente)
      queryClient.invalidateQueries({ queryKey: ['couple'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const res = await fetch('/api/profile/password', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao alterar senha')
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error ?? 'Erro ao sair da conta')
      }
    },
    onSuccess: () => {
      queryClient.clear()
      window.location.href = '/login'
    },
    onError: () => {
      // Mesmo com erro, força saída no client
      queryClient.clear()
      window.location.href = '/login'
    },
  })
}
