import { Inbox } from 'lucide-react'
import Image from 'next/image'
import { SeverityIcon } from '@/components/ui/SeverityIcon'

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
  icon,
  title,
  description,
  action,
  tone = 'neutral',
  nextSteps = [],
}: StatePanelProps) {
  const toneStyles: Record<EmptyStateTone, { border: string; background: string; iconBg: string; iconColor: string }> = {
    neutral: {
      border: 'rgba(195,179,164,0.42)',
      background: 'linear-gradient(180deg, rgba(255,252,248,0.98) 0%, rgba(248,245,240,0.96) 100%)',
      iconBg: 'rgba(201,183,156,0.18)',
      iconColor: '#6B5D52',
    },
    finance: {
      border: 'rgba(74,102,85,0.34)',
      background: 'linear-gradient(180deg, rgba(246,250,247,0.96) 0%, rgba(255,252,248,0.98) 100%)',
      iconBg: 'rgba(74,102,85,0.16)',
      iconColor: '#355145',
    },
    cards: {
      border: 'rgba(201,183,156,0.44)',
      background: 'linear-gradient(180deg, rgba(255,249,242,0.96) 0%, rgba(255,252,248,0.98) 100%)',
      iconBg: 'rgba(201,183,156,0.2)',
      iconColor: '#7C6A56',
    },
    goals: {
      border: 'rgba(15,118,110,0.28)',
      background: 'linear-gradient(180deg, rgba(240,248,246,0.94) 0%, rgba(255,252,248,0.98) 100%)',
      iconBg: 'rgba(15,118,110,0.14)',
      iconColor: '#0F766E',
    },
    couple: {
      border: 'rgba(217,119,95,0.34)',
      background: 'linear-gradient(180deg, rgba(255,246,242,0.96) 0%, rgba(255,252,248,0.98) 100%)',
      iconBg: 'rgba(217,119,95,0.16)',
      iconColor: '#B7634F',
    },
    category: {
      border: 'rgba(74,102,85,0.34)',
      background: 'linear-gradient(180deg, rgba(243,249,245,0.96) 0%, rgba(255,252,248,0.98) 100%)',
      iconBg: 'rgba(74,102,85,0.16)',
      iconColor: '#3A584B',
    },
    warning: {
      border: 'rgba(217,119,95,0.36)',
      background: 'linear-gradient(180deg, rgba(255,245,240,0.96) 0%, rgba(255,252,248,0.98) 100%)',
      iconBg: 'rgba(217,119,95,0.16)',
      iconColor: '#B05745',
    },
  }
  const style = toneStyles[tone]
  const hasCustomIcon = icon !== undefined
  const illustrationByTone: Record<EmptyStateTone, string> = {
    neutral: '/illustrations/empty-neutral.svg',
    finance: '/illustrations/empty-finance.svg',
    cards: '/illustrations/empty-cards.svg',
    goals: '/illustrations/empty-goals.svg',
    couple: '/illustrations/empty-couple.svg',
    category: '/illustrations/empty-category.svg',
    warning: '/illustrations/empty-division.svg',
  }
  const fallbackIcon = <Inbox size={26} className="text-[#6B5D52]" aria-hidden />

  return (
    <div
      className="motion-feedback card py-10 px-6 text-center overflow-hidden"
      style={{ borderColor: style.border, background: style.background }}
    >
      <div
        className="pointer-events-none absolute -top-8 -right-10 h-24 w-24 rounded-full blur-2xl"
        style={{ background: style.iconBg }}
      />
      {tone === 'couple' ? (
        <svg
          className="pointer-events-none absolute right-3 top-3 h-10 w-16 opacity-55"
          viewBox="0 0 96 64"
          fill="none"
          aria-hidden
        >
          <path
            d="M8 38c9 0 14-12 24-12 10 0 14 12 24 12s15-12 24-12"
            stroke={style.iconColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M8 48c9 0 14-12 24-12 10 0 14 12 24 12s15-12 24-12"
            stroke={style.iconColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      ) : null}
      {hasCustomIcon ? (
        <div className="mb-3 flex justify-center">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ background: style.iconBg, color: style.iconColor }}
          >
            {icon ?? fallbackIcon}
          </div>
        </div>
      ) : (
        <div className="mb-3 flex justify-center">
          <Image
            src={illustrationByTone[tone]}
            alt=""
            aria-hidden
            width={112}
            height={80}
            sizes="112px"
            className="w-28 h-20 object-contain select-none pointer-events-none"
          />
        </div>
      )}
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
        <SeverityIcon level="error" className="size-5 text-[#B91C1C]" aria-hidden />
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
