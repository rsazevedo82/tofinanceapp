// hooks/useNotifications.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState }                    from 'react'
import type { ApiResponse, Notification }        from '@/types'

const ACTIVE_POLLING_INTERVAL_MS = 30_000
const IDLE_POLLING_INTERVAL_MS = 90_000
const IDLE_AFTER_MS = 2 * 60_000

async function fetchNotifications(unreadOnly = false): Promise<Notification[]> {
  const url = unreadOnly ? '/api/notifications?unread=true' : '/api/notifications'
  const res  = await fetch(url)
  const json: ApiResponse<Notification[]> = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data ?? []
}

// ── Leitura ───────────────────────────────────────────────────────────────────

export function useNotifications() {
  const pageState = usePageState()

  return useNotificationsInternal({ enableLivePolling: false, ...pageState })
}

type UseNotificationsOptions = {
  enableLivePolling?: boolean
}

export function useNotificationsLive(options?: UseNotificationsOptions) {
  const pageState = usePageState()

  return useNotificationsInternal({
    enableLivePolling: options?.enableLivePolling ?? false,
    ...pageState,
  })
}

function usePageState() {
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [isUserActive, setIsUserActive] = useState(true)

  useEffect(() => {
    let idleTimeout: ReturnType<typeof setTimeout> | null = null

    const scheduleIdle = () => {
      if (idleTimeout) clearTimeout(idleTimeout)
      idleTimeout = setTimeout(() => {
        setIsUserActive(false)
      }, IDLE_AFTER_MS)
    }

    const markActive = () => {
      setIsUserActive(true)
      scheduleIdle()
    }

    const syncVisibility = () => setIsPageVisible(document.visibilityState === 'visible')
    const syncNetwork = () => setIsOnline(navigator.onLine)

    syncVisibility()
    syncNetwork()
    markActive()

    document.addEventListener('visibilitychange', syncVisibility)
    window.addEventListener('online', syncNetwork)
    window.addEventListener('offline', syncNetwork)
    window.addEventListener('pointerdown', markActive, { passive: true })
    window.addEventListener('keydown', markActive)
    window.addEventListener('touchstart', markActive, { passive: true })
    window.addEventListener('focus', markActive)

    return () => {
      if (idleTimeout) clearTimeout(idleTimeout)
      document.removeEventListener('visibilitychange', syncVisibility)
      window.removeEventListener('online', syncNetwork)
      window.removeEventListener('offline', syncNetwork)
      window.removeEventListener('pointerdown', markActive)
      window.removeEventListener('keydown', markActive)
      window.removeEventListener('touchstart', markActive)
      window.removeEventListener('focus', markActive)
    }
  }, [])

  return { isPageVisible, isOnline, isUserActive }
}

function useNotificationsInternal(params: {
  enableLivePolling: boolean
  isPageVisible: boolean
  isOnline: boolean
  isUserActive: boolean
}) {
  const shouldPoll = params.enableLivePolling && params.isPageVisible && params.isOnline
  const pollingInterval = shouldPoll
    ? (params.isUserActive ? ACTIVE_POLLING_INTERVAL_MS : IDLE_POLLING_INTERVAL_MS)
    : false

  const { data = [], ...rest } = useQuery({
    queryKey:        ['notifications'],
    queryFn:         () => fetchNotifications(),
    staleTime:       1000 * 60 * 2,
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
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
