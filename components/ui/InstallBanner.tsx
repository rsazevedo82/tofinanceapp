'use client'

// InstallBanner.tsx
// Exibe instrução para instalar o PWA no iOS (Safari não tem install prompt automático).
// Detecta: iOS + Safari + não está em modo standalone.

import { useState, useEffect } from 'react'
import { X, Share, Download } from 'lucide-react'

const INSTALL_BANNER_CAMPAIGN = 'v2'
const DISMISSED_KEY = `pwa-install-dismissed:${INSTALL_BANNER_CAMPAIGN}`
const LEGACY_DISMISSED_KEY = 'pwa-install-dismissed'
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000
type BannerMode = 'ios' | 'android'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type InstallDismissRecord = {
  dismissedAt: number
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function readDismissRecord(): InstallDismissRecord | null {
  const raw = localStorage.getItem(DISMISSED_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as InstallDismissRecord
    if (typeof parsed?.dismissedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function isDismissActive(): boolean {
  const record = readDismissRecord()
  if (!record) return false
  return (Date.now() - record.dismissedAt) < DISMISS_TTL_MS
}

function persistDismiss() {
  const payload: InstallDismissRecord = { dismissedAt: Date.now() }
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(payload))
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<BannerMode>('ios')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (isStandalone()) return

    // Limpa chave antiga para migrar para estratégia com TTL/versionamento.
    localStorage.removeItem(LEGACY_DISMISSED_KEY)
    if (isDismissActive()) return

    if (isIOS() && isSafari()) {
      setMode('ios')
      setVisible(true)
      return
    }

    const onBeforeInstallPrompt = (event: Event) => {
      const e = event as BeforeInstallPromptEvent
      e.preventDefault()
      setDeferredPrompt(e)
      setMode('android')
      setVisible(true)
    }

    const onInstalled = () => {
      setVisible(false)
      setDeferredPrompt(null)
      persistDismiss()
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() {
    persistDismiss()
    setVisible(false)
  }

  async function installOnAndroid() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl"
        style={{
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid #D1D5DB',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Ícone do app */}
        <div
          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold"
          style={{ background: 'rgba(255,127,80,0.12)', color: '#FF7F50' }}
        >
          N2
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#0F172A] leading-snug">
            Instale o Nós 2 Reais
          </p>
          {mode === 'ios' ? (
            <p className="text-[11px] mt-0.5 leading-snug text-[#6B7280]">
              Toque em <Share size={10} className="inline-block mx-0.5 align-middle" /> e depois{' '}
              <strong className="text-[#0F172A]">Adicionar à Tela de Início</strong>
            </p>
          ) : (
            <p className="text-[11px] mt-0.5 leading-snug text-[#6B7280]">
              Instale o app para abrir mais rápido e usar em tela cheia.
            </p>
          )}
        </div>

        {mode === 'android' ? (
          <button
            onClick={installOnAndroid}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-white bg-[#0F172A]"
          >
            <Download size={14} />
            Instalar
          </button>
        ) : null}

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
