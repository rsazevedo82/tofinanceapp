import { AlertTriangle, Inbox } from 'lucide-react'

type EmptyStateTone =
  | 'neutral'
  | 'finance'
  | 'cards'
  | 'goals'
  | 'couple'
  | 'category'
  | 'warning'

interface StatePanelProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  tone?: EmptyStateTone
  nextSteps?: string[]
}

export function EmptyStatePanel({
  icon = <Inbox size={26} className="text-[#64748B]" aria-hidden />,
  title,
  description,
  action,
  tone = 'neutral',
  nextSteps = [],
}: StatePanelProps) {
  const toneStyles: Record<EmptyStateTone, { border: string; background: string; iconBg: string; iconColor: string }> = {
    neutral: {
      border: 'rgba(148,163,184,0.28)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.9) 100%)',
      iconBg: 'rgba(148,163,184,0.14)',
      iconColor: '#475569',
    },
    finance: {
      border: 'rgba(45,212,191,0.3)',
      background: 'linear-gradient(180deg, rgba(236,253,250,0.88) 0%, rgba(255,255,255,0.98) 100%)',
      iconBg: 'rgba(45,212,191,0.16)',
      iconColor: '#0f766e',
    },
    cards: {
      border: 'rgba(245,158,11,0.3)',
      background: 'linear-gradient(180deg, rgba(255,251,235,0.92) 0%, rgba(255,255,255,0.98) 100%)',
      iconBg: 'rgba(245,158,11,0.16)',
      iconColor: '#b45309',
    },
    goals: {
      border: 'rgba(99,102,241,0.28)',
      background: 'linear-gradient(180deg, rgba(238,242,255,0.9) 0%, rgba(255,255,255,0.98) 100%)',
      iconBg: 'rgba(99,102,241,0.14)',
      iconColor: '#4338ca',
    },
    couple: {
      border: 'rgba(236,72,153,0.26)',
      background: 'linear-gradient(180deg, rgba(253,242,248,0.9) 0%, rgba(255,255,255,0.98) 100%)',
      iconBg: 'rgba(236,72,153,0.14)',
      iconColor: '#be185d',
    },
    category: {
      border: 'rgba(16,185,129,0.28)',
      background: 'linear-gradient(180deg, rgba(236,253,245,0.9) 0%, rgba(255,255,255,0.98) 100%)',
      iconBg: 'rgba(16,185,129,0.14)',
      iconColor: '#047857',
    },
    warning: {
      border: 'rgba(239,68,68,0.26)',
      background: 'linear-gradient(180deg, rgba(254,242,242,0.9) 0%, rgba(255,255,255,0.98) 100%)',
      iconBg: 'rgba(239,68,68,0.14)',
      iconColor: '#b91c1c',
    },
  }
  const style = toneStyles[tone]

  return (
    <div
      className="motion-feedback card py-10 px-6 text-center"
      style={{ borderColor: style.border, background: style.background }}
    >
      <div className="mb-3 flex justify-center">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center"
          style={{ background: style.iconBg, color: style.iconColor }}
        >
          {icon}
        </div>
      </div>
      <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
      {description ? (
        <p className="text-sm text-[#334155] mt-1 max-w-xl mx-auto">{description}</p>
      ) : null}
      {nextSteps.length > 0 ? (
        <div className="mt-3 rounded-lg bg-white/75 border border-[#E5E7EB] px-3 py-2 text-left max-w-xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#64748B] font-semibold mb-1">Próximos passos</p>
          <ul className="space-y-1">
            {nextSteps.map((step, idx) => (
              <li key={`${step}-${idx}`} className="text-xs text-[#334155]">
                • {step}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {action ? (
        <div className="mt-4 flex justify-center">{action}</div>
      ) : null}
    </div>
  )
}

interface ErrorStatePanelProps {
  title?: string
  description: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorStatePanel({
  title = 'Não foi possível carregar os dados',
  description,
  onRetry,
  retryLabel = 'Tentar novamente',
}: ErrorStatePanelProps) {
  return (
    <div className="motion-feedback card py-8 px-6 text-center alert-box alert-box-error">
      <div className="mb-2 flex justify-center">
        <AlertTriangle size={20} className="text-[#B91C1C]" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-[#7F1D1D]">{title}</p>
      <p className="text-sm text-[#7F1D1D] mt-1">{description}</p>
      {onRetry ? (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={onRetry} className="btn-secondary">
            {retryLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function LoadingStatePanel({ rows = 3 }: { rows?: number }) {
  return (
    <div className="motion-feedback card py-5">
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="rounded-lg border border-[#E5E7EB] px-3 py-3">
            <div className="h-3 bg-[#E5E7EB] rounded w-40 mb-2" />
            <div className="h-2 bg-[#E5E7EB] rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
