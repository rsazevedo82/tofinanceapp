'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'info'

type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastItem = ToastInput & { id: string; variant: ToastVariant }

type ToastContextValue = {
  showToast: (toast: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const VARIANT_STYLES: Record<ToastVariant, { border: string; bg: string; title: string }> = {
  success: { border: '#86EFAC', bg: '#F0FDF4', title: '#166534' },
  error: { border: '#FECACA', bg: '#FEF2F2', title: '#991B1B' },
  info: { border: '#CBD5E1', bg: '#F8FAFC', title: '#0F172A' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(current => current.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID()
    const variant = toast.variant ?? 'info'
    const duration = toast.durationMs ?? 3000

    setToasts(current => [...current, { ...toast, id, variant }])
    window.setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed right-3 left-3 sm:left-auto bottom-3 z-[100] space-y-2 sm:w-[360px]" aria-live="polite">
        {toasts.map(toast => {
          const style = VARIANT_STYLES[toast.variant]
          return (
            <div
              key={toast.id}
              className="rounded-xl border px-3 py-2.5 shadow-lg"
              style={{ borderColor: style.border, background: style.bg }}
              role={toast.variant === 'error' ? 'alert' : 'status'}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: style.title }}>
                    {toast.title}
                  </p>
                  {toast.description ? (
                    <p className="text-xs mt-0.5 text-[#475569] line-clamp-2">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="text-xs text-[#475569] hover:text-[#0F172A] transition-colors"
                  aria-label="Fechar notificação"
                >
                  Fechar
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return context
}
