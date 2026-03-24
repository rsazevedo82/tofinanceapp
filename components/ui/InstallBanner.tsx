'use client'

// InstallBanner.tsx
// Exibe instrução para instalar o PWA no iOS (Safari não tem install prompt automático).
// Detecta: iOS + Safari + não está em modo standalone.

import { useState, useEffect } from 'react'
import { X, Share } from 'lucide-react'

const DISMISSED_KEY = 'pwa-install-dismissed'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (!dismissed && isIOS() && isSafari() && !isStandalone()) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl"
        style={{
          background: 'rgba(28,28,26,0.97)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Ícone do app */}
        <div
          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold"
          style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8' }}
        >
          N2
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#f0ede8] leading-snug">
            Instale o Nós Dois Reais
          </p>
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
            Toque em <Share size={10} className="inline-block mx-0.5 align-middle" /> e depois{' '}
            <strong className="text-[#e8e6e1]">Adicionar à Tela de Início</strong>
          </p>
        </div>

        {/* Fechar */}
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="shrink-0 p-1 rounded-lg"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
