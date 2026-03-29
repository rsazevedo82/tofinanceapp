import { AlertTriangle, CheckCircle2, Clock3, Info, Lock, XCircle } from 'lucide-react'

export type SeverityLevel = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'blocked'

export function SeverityIcon({
  level,
  className = 'size-4',
  'aria-hidden': ariaHidden = true,
}: {
  level: SeverityLevel
  className?: string
  'aria-hidden'?: boolean
}) {
  switch (level) {
    case 'success':
      return <CheckCircle2 className={className} strokeWidth={1.7} aria-hidden={ariaHidden} />
    case 'warning':
      return <AlertTriangle className={className} strokeWidth={1.8} aria-hidden={ariaHidden} />
    case 'error':
      return <XCircle className={className} strokeWidth={1.8} aria-hidden={ariaHidden} />
    case 'pending':
      return <Clock3 className={className} strokeWidth={1.7} aria-hidden={ariaHidden} />
    case 'blocked':
      return <Lock className={className} strokeWidth={1.8} aria-hidden={ariaHidden} />
    case 'info':
    default:
      return <Info className={className} strokeWidth={1.8} aria-hidden={ariaHidden} />
  }
}
