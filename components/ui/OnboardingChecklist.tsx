'use client'

// OnboardingChecklist.tsx
// Exibido no dashboard para usuários novos que ainda não completaram o setup básico.
// Status derivado dos dados reais — sem migration de banco.
// Dismissable via localStorage.

import { useState, useEffect }   from 'react'
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

  const { data: accounts = [] } = useAccounts()
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

  useEffect(() => {
    // Lê o localStorage apenas no client
    const isDismissed = localStorage.getItem(DISMISSED_KEY) === '1'
    setDismissed(isDismissed)
  }, [])

  // Esconde automaticamente quando os passos obrigatórios estão concluídos
  if (requiredDone || dismissed) return null

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div
      className="card mb-6"
      style={{ border: '0.5px solid rgba(129,140,248,0.25)', background: 'rgba(129,140,248,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-[#e8e6e1]">
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

      {/* Barra de progresso */}
      <div
        className="h-1 rounded-full mb-4 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width:      `${(completedCount / steps.length) * 100}%`,
            background: 'rgba(129,140,248,0.7)',
          }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map(step => (
          <div
            key={step.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
            style={{
              background: step.done
                ? 'rgba(110,231,183,0.05)'
                : 'rgba(255,255,255,0.02)',
              border: '0.5px solid',
              borderColor: step.done
                ? 'rgba(110,231,183,0.15)'
                : 'rgba(255,255,255,0.05)',
            }}
          >
            {/* Ícone status */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0"
              style={{
                background: step.done
                  ? 'rgba(110,231,183,0.2)'
                  : 'rgba(255,255,255,0.06)',
                color: step.done ? '#6ee7b7' : 'rgba(200,198,190,0.3)',
              }}
            >
              {step.done ? '✓' : '○'}
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium leading-tight"
                style={{
                  color:          step.done ? '#6ee7b7' : '#e8e6e1',
                  textDecoration: step.done ? 'line-through' : 'none',
                  opacity:        step.done ? 0.7 : 1,
                }}
              >
                {step.label}
                {!step.required && (
                  <span
                    className="ml-1.5 text-[10px] font-normal"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    opcional
                  </span>
                )}
              </p>
              {!step.done && (
                <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>
                  {step.description}
                </p>
              )}
            </div>

            {/* CTA */}
            {!step.done && (
              <button
                onClick={step.action}
                className="text-[11px] px-2.5 py-1 rounded-lg shrink-0 transition-colors"
                style={{
                  background:  'rgba(129,140,248,0.12)',
                  border:      '0.5px solid rgba(129,140,248,0.25)',
                  color:       '#818cf8',
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
