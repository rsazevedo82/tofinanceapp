'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { SeverityIcon } from '@/components/ui/SeverityIcon'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

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

const VARIANT_CLASSES: Record<ToastVariant, { box: string; title: string }> = {
  success: { box: 'alert-box alert-box-success', title: 'text-[#0f766e]' },
  warning: { box: 'alert-box alert-box-warning', title: 'text-[#b45309]' },
  error: { box: 'alert-box alert-box-error', title: 'text-[#991B1B]' },
  info: { box: 'alert-box alert-box-info', title: 'text-[#0F172A]' },
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

      <div
        className="fixed right-3 left-3 sm:left-auto z-[100] space-y-2 sm:w-[360px]"
        style={{ bottom: 'calc(0.75rem + var(--n2r-overlay-bottom-offset, 0px))' }}
        aria-live="polite"
      >
        {toasts.map(toast => {
          const style = VARIANT_CLASSES[toast.variant]
          return (
            <div
              key={toast.id}
              className={`motion-feedback ${style.box} shadow-lg`}
              role={toast.variant === 'error' ? 'alert' : 'status'}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-start gap-2">
                  <SeverityIcon
                    level={toast.variant === 'warning' ? 'warning' : toast.variant}
                    className={`size-4 mt-0.5 ${style.title}`}
                  />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${style.title}`}>
                      {toast.title}
                    </p>
                  {toast.description ? (
                    <p className="text-xs mt-0.5 text-[#334155] line-clamp-2">{toast.description}</p>
                  ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="text-xs text-[#334155] hover:text-[#0F172A] transition-colors"
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

