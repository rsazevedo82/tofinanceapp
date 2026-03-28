'use client'

// OnboardingChecklist.tsx
// Exibido no dashboard para usuários novos que ainda não completaram o setup básico.
// Status derivado dos dados reais — sem migration de banco.
// Dismissable via localStorage.

import { useState, useEffect, useMemo, useRef }   from 'react'
import { useRouter }             from 'next/navigation'
import { useAccounts }           from '@/hooks/useAccounts'
import { useCouple }             from '@/hooks/useCouple'
import type { DashboardData }    from '@/app/api/dashboard/route'

const DISMISSED_KEY = 'onboarding-checklist-dismissed'

interface Props {
  dashboardData: DashboardData
  onNewTransaction: () => void
}

interface Step {
  id:          string
  label:       string
  description: string
  done:        boolean
  required:    boolean
  action:      () => void
  actionLabel: string
}

export function OnboardingChecklist({ dashboardData, onNewTransaction }: Props) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(true) // começa true para evitar flash
  const [recentlyCompleted, setRecentlyCompleted] = useState<string[]>([])
  const previousDoneMapRef = useRef<Record<string, boolean> | null>(null)

  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts()
  const { data: couple }        = useCouple()

  const hasAccount     = accounts.length > 0
  const hasTransaction = dashboardData.income_month > 0 || dashboardData.expense_month > 0
  const hasCouple      = !!couple

  const steps: Step[] = [
    {
      id:          'account',
      label:       'Adicione uma conta',
      description: 'Corrente, poupança ou carteira — por onde você movimenta dinheiro.',
      done:        hasAccount,
      required:    true,
      action:      () => router.push('/contas'),
      actionLabel: 'Ir para Contas',
    },
    {
      id:          'transaction',
      label:       'Registre seu primeiro gasto',
      description: 'Anote uma despesa ou receita para começar a acompanhar.',
      done:        hasTransaction,
      required:    true,
      action:      onNewTransaction,
      actionLabel: 'Registrar gasto',
    },
    {
      id:          'couple',
      label:       'Convide seu parceiro',
      description: 'Conectem-se para ver as finanças juntos.',
      done:        hasCouple,
      required:    false,
      action:      () => router.push('/casal'),
      actionLabel: 'Conectar casal',
    },
  ]

  const requiredDone  = steps.filter(s => s.required).every(s => s.done)
  const completedCount = steps.filter(s => s.done).length
  const progressPercent = useMemo(
    () => (completedCount / steps.length) * 100,
    [completedCount, steps.length]
  )

  useEffect(() => {
    // Lê o localStorage apenas no client
    const isDismissed = localStorage.getItem(DISMISSED_KEY) === '1'
    setDismissed(isDismissed)
  }, [])

  useEffect(() => {
    const currentDoneMap = Object.fromEntries(steps.map(step => [step.id, step.done]))

    if (!previousDoneMapRef.current) {
      previousDoneMapRef.current = currentDoneMap
      return
    }

    const newlyCompleted = steps
      .filter(step => step.done && !previousDoneMapRef.current?.[step.id])
      .map(step => step.id)

    if (newlyCompleted.length > 0) {
      setRecentlyCompleted(newlyCompleted)
      const timer = setTimeout(() => setRecentlyCompleted([]), 950)
      previousDoneMapRef.current = currentDoneMap
      return () => clearTimeout(timer)
    }

    previousDoneMapRef.current = currentDoneMap
  }, [steps])

  // Evita "flash" enquanto contas ainda estão carregando.
  if (loadingAccounts) return null

  // Esconde automaticamente quando os passos obrigatórios estão concluídos
  if (requiredDone || dismissed) return null

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div
      className="card mb-6"
      style={{ border: '1px solid rgba(255,127,80,0.2)', background: 'rgba(255,127,80,0.03)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">
            Primeiros passos 👋
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {completedCount} de {steps.length} concluídos
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="text-xs px-2 py-1 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          ✕
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-[#FED7AA] bg-white/80 px-3 py-2.5 flex items-center gap-3">
        <img
          src="/illustrations/context-onboarding-path.svg"
          alt=""
          aria-hidden
          className="w-24 h-10 object-contain select-none pointer-events-none shrink-0"
        />
        <p className="text-xs text-[#334155] leading-snug">
          Cada etapa concluída melhora os relatórios e reduz retrabalho no dia a dia.
        </p>
      </div>

      {/* Barra de progresso */}
      <div
        className="h-1 rounded-full mb-4 overflow-visible relative"
        style={{ background: '#E5E7EB' }}
      >
        <div
          className="h-full rounded-full motion-progress"
          style={{
            width:      `${progressPercent}%`,
            background: 'linear-gradient(90deg, #FF7F50 0%, #F97316 50%, #FF7F50 100%)',
          }}
        />
        {progressPercent > 0 && (
          <span
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white ${recentlyCompleted.length > 0 ? 'motion-checkpoint' : ''}`}
            style={{
              left: `${progressPercent}%`,
              background: '#FF7F50',
              boxShadow: '0 0 0 2px rgba(255,127,80,0.2)',
            }}
          />
        )}
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map(step => (
          <div
            key={step.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
            style={{
              background: step.done
                ? 'rgba(45,212,191,0.05)'
                : '#F9FAFB',
              border: '1px solid',
              borderColor: step.done
                ? 'rgba(45,212,191,0.2)'
                : '#E5E7EB',
            }}
          >
            {/* Ícone status */}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${recentlyCompleted.includes(step.id) ? 'motion-checkpoint' : ''}`}
              style={{
                background: step.done
                  ? 'rgba(45,212,191,0.15)'
                  : '#E5E7EB',
                color: step.done ? '#0d9488' : '#9CA3AF',
              }}
            >
              {step.done ? '✓' : '○'}
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium leading-tight"
                style={{
                  color:          step.done ? '#0d9488' : '#0F172A',
                  textDecoration: step.done ? 'line-through' : 'none',
                  opacity:        step.done ? 0.7 : 1,
                }}
              >
                {step.label}
                {!step.required && (
                  <span
                    className="ml-1.5 text-xs font-normal"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    opcional
                  </span>
                )}
              </p>
              {!step.done && (
                <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>
                  {step.description}
                </p>
              )}
            </div>

            {/* CTA */}
            {!step.done && (
              <button
                onClick={step.action}
                className="text-xs px-2.5 py-1 rounded-lg shrink-0 transition-colors"
                style={{
                  background:  'rgba(255,127,80,0.1)',
                  border:      '1px solid rgba(255,127,80,0.25)',
                  color:       '#FF7F50',
                }}
              >
                {step.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
