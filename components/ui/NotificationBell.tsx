// components/ui/NotificationBell.tsx
'use client'

import { useState, useRef, useEffect }      from 'react'
import { Bell }                             from 'lucide-react'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications'
import type { Notification }                from '@/types'

const TYPE_ICONS: Record<string, string> = {
  couple_invite:   '💌',
  couple_accepted: '💑',
  couple_unlinked: '💔',
  goal_reached:    '🎯',
  invoice_closed:  '💳',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'agora'
  if (mins < 60)  return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days  = Math.floor(hours / 24)
  return `há ${days}d`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)

  const { data, unreadCount }  = useNotifications()
  const markAsRead             = useMarkAsRead()
  const markAllAsRead          = useMarkAllAsRead()

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleItemClick(notification: Notification) {
    if (!notification.read_at) {
      markAsRead.mutate(notification.id)
    }
  }

  const preview = data.slice(0, 5)

  return (
    <div ref={ref} className="relative">
      {/* Botão sino */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
        style={{
          color:      unreadCount > 0 ? '#f0ede8' : 'rgba(200,198,190,0.45)',
          background: open ? 'rgba(255,255,255,0.06)' : 'transparent',
        }}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold px-1"
            style={{ background: '#f87171', color: '#fff' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-xl overflow-hidden z-50"
          style={{
            background:  '#161614',
            border:      '0.5px solid rgba(255,255,255,0.08)',
            boxShadow:   '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header do dropdown */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
            <span className="text-xs font-semibold text-[#e8e6e1]">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                className="text-[10px] transition-colors"
                style={{ color: 'rgba(200,198,190,0.45)' }}
                disabled={markAllAsRead.isPending}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista */}
          {preview.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-2">🔔</p>
              <p className="text-xs" style={{ color: 'rgba(200,198,190,0.35)' }}>
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {preview.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors"
                  style={{
                    background:   n.read_at ? 'transparent' : 'rgba(255,255,255,0.02)',
                    borderBottom: '0.5px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] ?? '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-medium truncate ${n.read_at ? 'text-[#9ca3af]' : 'text-[#e8e6e1]'}`}>
                        {n.title}
                      </p>
                      {!n.read_at && (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                          style={{ background: '#818cf8' }} />
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5 line-clamp-2"
                      style={{ color: 'rgba(200,198,190,0.45)' }}>
                      {n.body}
                    </p>
                    <p className="text-[10px] mt-1"
                      style={{ color: 'rgba(200,198,190,0.3)' }}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {data.length > 5 && (
            <div className="px-4 py-2.5 text-center"
              style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[10px]" style={{ color: 'rgba(200,198,190,0.35)' }}>
                +{data.length - 5} notificações anteriores
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
