// app/offline/page.tsx
// Exibida pelo service worker quando não há conexão
'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function OfflinePage() {
  useEffect(() => {
    let cancelled = false

    async function probeAndRecover() {
      try {
        // Probe no mesmo domínio para evitar falso "online" de outros apps.
        const res = await fetch(`/manifest.webmanifest?ts=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
        })
        if (!cancelled && res.ok) {
          window.location.replace('/')
        }
      } catch {
        // Ainda offline ou SW sem resposta válida.
      }
    }

    const interval = window.setInterval(probeAndRecover, 3000)
    probeAndRecover()

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <p className="text-4xl mb-4">📡</p>
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
