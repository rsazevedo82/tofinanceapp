import {
  Bell,
  CreditCard,
  LockKeyhole,
  Mail,
  MailWarning,
  Shield,
  Target,
  UserCheck,
  UserX,
} from 'lucide-react'

export function NotificationTypeIcon({ type, className = 'h-4 w-4 text-[#475569]' }: { type: string; className?: string }) {
  switch (type) {
    case 'couple_invite':
      return <Mail className={className} strokeWidth={1.8} aria-hidden />
    case 'couple_accepted':
      return <UserCheck className={className} strokeWidth={1.7} aria-hidden />
    case 'couple_unlinked':
      return <UserX className={className} strokeWidth={1.7} aria-hidden />
    case 'goal_reached':
      return <Target className={className} strokeWidth={1.8} aria-hidden />
    case 'invoice_closed':
      return <CreditCard className={className} strokeWidth={1.7} aria-hidden />
    case 'security_new_device':
      return <Shield className={className} strokeWidth={1.7} aria-hidden />
    case 'security_password_changed':
      return <LockKeyhole className={className} strokeWidth={1.8} aria-hidden />
    case 'security_email_change_requested':
      return <MailWarning className={className} strokeWidth={1.8} aria-hidden />
    default:
      return <Bell className={className} strokeWidth={1.7} aria-hidden />
  }
}
