import { AlertTriangle, Inbox } from 'lucide-react'

interface StatePanelProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyStatePanel({
  icon = <Inbox size={26} className="text-[#64748B]" aria-hidden />,
  title,
  description,
  action,
}: StatePanelProps) {
  return (
    <div className="motion-feedback card py-12 px-6 text-center">
      <div className="mb-3 flex justify-center">{icon}</div>
      <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
      {description ? (
        <p className="text-sm text-[#334155] mt-1">{description}</p>
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
    <div className="motion-feedback card py-8 px-6 text-center" style={{ borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(254,242,242,0.6)' }}>
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
