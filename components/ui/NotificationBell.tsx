// components/ui/NotificationBell.tsx
'use client'

import { useState, useRef, useEffect }      from 'react'
import { Bell }                             from 'lucide-react'
import { useNotificationsLive, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications'
import { NotificationTypeIcon }             from '@/components/ui/NotificationTypeIcon'
import type { Notification }                from '@/types'

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

  const { data, unreadCount }  = useNotificationsLive({ enableLivePolling: open })
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
          color:      unreadCount > 0 ? '#0F172A' : '#334155',
          background: open ? '#F3F4F6' : 'transparent',
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
          className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] rounded-xl overflow-hidden z-50"
          style={{
            background:  '#ffffff',
            border:      '1px solid #D1D5DB',
            boxShadow:   '0 8px 32px rgba(15,23,42,0.12)',
          }}
        >
          {/* Header do dropdown */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid #D1D5DB' }}>
            <span className="text-xs font-semibold text-[#0F172A]">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                className="text-xs text-[#334155] hover:text-[#0F172A] transition-colors"
                disabled={markAllAsRead.isPending}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista */}
          {preview.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="mb-2 flex justify-center">
                <Bell size={18} className="text-[#64748B]" aria-hidden />
              </div>
              <p className="text-xs text-[#334155]">
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
                    background:   n.read_at ? 'transparent' : 'rgba(255,127,80,0.03)',
                    borderBottom: '1px solid rgba(209,213,219,0.5)',
                  }}
                >
                  <span className="flex-shrink-0 mt-0.5">
                    <NotificationTypeIcon type={n.type} className="h-4 w-4 text-[#475569]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-medium truncate ${n.read_at ? 'text-[#334155]' : 'text-[#0F172A]'}`}>
                        {n.title}
                      </p>
                      {!n.read_at && (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                          style={{ background: '#FF7F50' }} />
                      )}
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-2 text-[#334155]">
                      {n.body}
                    </p>
                    <p className="text-xs mt-1 text-[#64748B]">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {data.length > 5 && (
            <div className="px-4 py-2.5 text-center border-t border-[#D1D5DB]">
              <span className="text-xs text-[#334155]">
                +{data.length - 5} notificações anteriores
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

