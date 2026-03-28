'use client'

import { useEffect } from 'react'

const UPDATE_INTERVAL_MS = 5 * 60 * 1000

function activateWaitingWorker(registration: ServiceWorkerRegistration) {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
}

export function PwaAutoUpdate() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    let isMounted = true
    let isReloading = false
    let registration: ServiceWorkerRegistration | null = null
    let intervalId: ReturnType<typeof setInterval> | null = null

    const reloadOnce = () => {
      if (isReloading) return
      isReloading = true
      window.location.reload()
    }

    const checkForUpdates = async () => {
      if (!registration) return
      try {
        await registration.update()
        if (registration.waiting) {
          activateWaitingWorker(registration)
        }
      } catch {
        // Erros de update são esperados em cenários offline/intermitentes.
      }
    }

    const onUpdateFound = () => {
      if (!registration) return
      const currentRegistration = registration
      const installingWorker = currentRegistration.installing
      if (!installingWorker) return

      installingWorker.addEventListener('statechange', () => {
        if (
          installingWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          activateWaitingWorker(currentRegistration)
        }
      })
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdates()
      }
    }

    const onOnline = () => {
      void checkForUpdates()
    }

    const onControllerChange = () => {
      reloadOnce()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    void navigator.serviceWorker.ready.then((reg) => {
      if (!isMounted) return
      registration = reg
      registration.addEventListener('updatefound', onUpdateFound)

      if (registration.waiting) {
        activateWaitingWorker(registration)
      }

      intervalId = setInterval(() => {
        void checkForUpdates()
      }, UPDATE_INTERVAL_MS)

      document.addEventListener('visibilitychange', onVisibilityChange)
      window.addEventListener('online', onOnline)
    })

    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
      registration?.removeEventListener('updatefound', onUpdateFound)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('online', onOnline)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}
