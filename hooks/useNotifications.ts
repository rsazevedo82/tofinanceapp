// hooks/useNotifications.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState }                    from 'react'
import type { ApiResponse, Notification }        from '@/types'

async function fetchNotifications(unreadOnly = false): Promise<Notification[]> {
  const url = unreadOnly ? '/api/notifications?unread=true' : '/api/notifications'
  const res  = await fetch(url)
  const json: ApiResponse<Notification[]> = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data ?? []
}

// ── Leitura ───────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [isPageVisible, setIsPageVisible] = useState(true)

  useEffect(() => {
    const syncVisibility = () => setIsPageVisible(document.visibilityState === 'visible')

    syncVisibility()
    document.addEventListener('visibilitychange', syncVisibility)

    return () => {
      document.removeEventListener('visibilitychange', syncVisibility)
    }
  }, [])

  return useNotificationsInternal({ enableLivePolling: false, isPageVisible })
}

type UseNotificationsOptions = {
  enableLivePolling?: boolean
}

export function useNotificationsLive(options?: UseNotificationsOptions) {
  const [isPageVisible, setIsPageVisible] = useState(true)

  useEffect(() => {
    const syncVisibility = () => setIsPageVisible(document.visibilityState === 'visible')

    syncVisibility()
    document.addEventListener('visibilitychange', syncVisibility)

    return () => {
      document.removeEventListener('visibilitychange', syncVisibility)
    }
  }, [])

  return useNotificationsInternal({
    enableLivePolling: options?.enableLivePolling ?? false,
    isPageVisible,
  })
}

function useNotificationsInternal(params: { enableLivePolling: boolean; isPageVisible: boolean }) {
  const shouldPoll = params.enableLivePolling && params.isPageVisible

  const { data = [], ...rest } = useQuery({
    queryKey:        ['notifications'],
    queryFn:         () => fetchNotifications(),
    staleTime:       1000 * 60 * 2,
    refetchInterval: shouldPoll ? 1000 * 90 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })

  const unreadCount = data.filter(n => !n.read_at).length

  return { data, unreadCount, ...rest }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res  = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      const json: ApiResponse<Notification> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res  = await fetch('/api/notifications/read-all', { method: 'PATCH' })
      const json: ApiResponse<{ count: number }> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
