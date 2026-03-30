// app/offline/page.tsx
// Exibida pelo service worker quando não há conexão
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function OfflinePage() {
  useEffect(() => {
    let cancelled = false
    let retryDelayMs = 3000
    const maxRetryDelayMs = 60000
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    function clearProbe() {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    function scheduleProbe(delay: number) {
      clearProbe()
      timeoutId = setTimeout(() => {
        void probeAndRecover()
      }, delay)
    }

    function increaseBackoff() {
      retryDelayMs = Math.min(retryDelayMs * 2, maxRetryDelayMs)
    }

    async function probeAndRecover() {
      if (cancelled) return

      if (document.visibilityState !== 'visible' || !navigator.onLine) {
        increaseBackoff()
        scheduleProbe(retryDelayMs)
        return
      }

      try {
        // Probe em endpoint de rede (API) para evitar falso "online" via cache do SW.
        const res = await fetch(`/api/healthz?ts=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
        })
        if (!cancelled && res.ok) {
          window.location.replace('/')
          return
        }
      } catch {
        // Ainda offline ou SW sem resposta válida.
      }

      increaseBackoff()
      scheduleProbe(retryDelayMs)
    }

    function retryNow() {
      if (cancelled) return
      retryDelayMs = 3000
      void probeAndRecover()
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        retryNow()
      }
    }

    window.addEventListener('online', retryNow)
    document.addEventListener('visibilitychange', onVisibilityChange)
    retryNow()

    return () => {
      cancelled = true
      clearProbe()
      window.removeEventListener('online', retryNow)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="mb-4 flex justify-center">
          <Image
            src="/illustrations/empty-offline.svg"
            alt=""
            aria-hidden
            width={160}
            height={96}
            sizes="160px"
            priority
            className="w-40 h-24 object-contain select-none pointer-events-none"
          />
        </div>
        <h1 className="text-lg font-semibold text-[#0F172A] mb-2">
          Você está offline
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Verifique sua conexão e tente novamente.
        </p>
        <Link href="/" className="btn-primary inline-flex text-sm px-6 py-2.5">
          Tentar novamente
        </Link>
      </div>
    </div>
  )
}
