'use client'

import Link      from 'next/link'
import { usePathname } from 'next/navigation'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useState }         from 'react'
import { useCouple }        from '@/hooks/useCouple'
import { useProfile, useLogout } from '@/hooks/useProfile'
import {
  FcHome,
  FcMoneyTransfer,
  FcSafe,
  FcSimCard,
  FcList,
  FcBarChart,
  FcPositiveDynamic,
  FcCollaboration,
  FcConferenceCall,
  FcManager,
} from 'react-icons/fc'
import type { IconType } from 'react-icons'

interface NavItem {
  href:         string
  label:        string
  icon:         IconType
  locked?:      boolean
  lockMessage?: string
  lockHint?:    string
}

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lockedInfo, setLockedInfo] = useState<{ label: string; message: string; hint: string } | null>(null)

  const { data: couple }  = useCouple()
  const { data: profile } = useProfile()
  const logout            = useLogout()
  const hasCouple = !!couple

  const navItems: NavItem[] = [
    { href: '/',           label: 'Visão geral',         icon: FcHome },
    { href: '/transacoes', label: 'Gastos',               icon: FcMoneyTransfer },
    { href: '/contas',     label: 'Contas',               icon: FcSafe },
    { href: '/cartoes',    label: 'Cartões',              icon: FcSimCard },
    { href: '/categorias', label: 'Categorias',           icon: FcList },
    { href: '/relatorios', label: 'Relatórios',           icon: FcBarChart },
    { href: '/objetivos',  label: 'Objetivos',            icon: FcPositiveDynamic },
    {
      href:        '/divisao',
      label:       'Divisão de despesas',
      icon:        FcCollaboration,
      locked:      !hasCouple,
      lockMessage: 'A divisão de despesas só está disponível para casais vinculados.',
      lockHint:    'Acesse Conexão do casal e convide seu parceiro(a) para desbloquear.',
    },
    { href: '/casal',      label: 'Conexão do casal',    icon: FcConferenceCall },
  ]

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#e8e6e1' }}
          >
            N
          </div>
          <span className="text-sm font-semibold text-[#e8e6e1] tracking-tight">Nós Dois Reais</span>
        </div>
        <NotificationBell />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-1 space-y-0.5">
        <p className="section-heading px-2 pt-2">Menu</p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          const Icon = item.icon

          if (item.locked) {
            return (
              <button
                key={item.href}
                onClick={() => setLockedInfo({
                  label:   item.label,
                  message: item.lockMessage!,
                  hint:    item.lockHint!,
                })}
                className="db-row gap-2 text-sm w-full transition-colors text-[#9ca3af]/50 hover:text-[#9ca3af] hover:bg-white/[0.02]"
              >
                <Icon size={18} className="w-4 shrink-0 opacity-30" />
                <span className="flex-1 text-left">{item.label}</span>
                <span className="text-[10px] opacity-40">🔒</span>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`db-row gap-2 text-sm w-full transition-colors ${
                isActive
                  ? 'text-[#e8e6e1] font-medium bg-white/[0.06]'
                  : 'text-[#9ca3af] hover:text-[#e8e6e1] hover:bg-white/[0.03]'
              }`}
            >
              <Icon size={18} className={`w-4 shrink-0 ${isActive ? 'opacity-100' : 'opacity-60'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer — perfil do usuário */}
      <div className="px-1 pb-3 border-t border-white/[0.05] pt-3 space-y-0.5">
        <Link
          href="/perfil"
          onClick={() => setMobileOpen(false)}
          className={`db-row gap-2 text-sm w-full transition-colors ${
            pathname === '/perfil'
              ? 'text-[#e8e6e1] font-medium bg-white/[0.06]'
              : 'text-[#9ca3af] hover:text-[#e8e6e1] hover:bg-white/[0.03]'
          }`}
        >
          {profile?.name || profile?.email ? (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8' }}
            >
              {(profile.name ?? profile.email).charAt(0).toUpperCase()}
            </div>
          ) : (
            <FcManager size={18} className="w-4 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs leading-tight">
              {profile?.name ?? 'Meu perfil'}
            </p>
            {profile?.email && (
              <p className="truncate text-[10px] leading-tight opacity-50">
                {profile.email}
              </p>
            )}
          </div>
        </Link>

        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="db-row gap-2 text-sm w-full transition-colors text-[#9ca3af]/60 hover:text-[#f87171] hover:bg-white/[0.02]"
        >
          <span className="w-4 text-center text-[13px] shrink-0 opacity-50">↪</span>
          <span>{logout.isPending ? 'Saindo...' : 'Sair da conta'}</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Modal: item bloqueado */}
      {lockedInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setLockedInfo(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 space-y-3"
            style={{ background: '#1c1c1a', border: '0.5px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <h3 className="font-semibold text-[#f0ede8]">{lockedInfo.label} indisponível</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {lockedInfo.message}
            </p>
            <p className="text-sm text-indigo-300">
              {lockedInfo.hint}
            </p>
            <button
              onClick={() => setLockedInfo(null)}
              className="btn-secondary w-full text-sm mt-2"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Desktop */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col z-30"
        style={{
          background:  'rgba(255,255,255,0.015)',
          borderRight: '0.5px solid rgba(255,255,255,0.06)',
          paddingTop:  'env(safe-area-inset-top,  0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
        }}
      >
        <NavContent />
      </aside>

      {/* Mobile header — altura cresce para cobrir o notch/Dynamic Island */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 flex flex-col justify-end px-4 z-30"
        style={{
          background:     'rgba(17,17,16,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom:   '0.5px solid rgba(255,255,255,0.06)',
          paddingTop:     'env(safe-area-inset-top, 0px)',
          minHeight:      'calc(3rem + env(safe-area-inset-top, 0px))',
        }}
      >
        {/* Linha de conteúdo com altura fixa de 48px — independente do safe area */}
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#e8e6e1' }}
            >N</div>
            <span className="text-sm font-semibold text-[#e8e6e1] tracking-tight">Nós Dois Reais</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileOpen(true)}
              className="text-[#9ca3af] hover:text-[#e8e6e1] transition-colors p-1"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="relative w-56 flex flex-col h-full"
            style={{ background: '#161614', borderRight: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 text-[#9ca3af] hover:text-[#e8e6e1] text-sm p-1"
            >✕</button>
            <NavContent />
          </div>
        </div>
      )}

      {/* Espaçador compensa o header fixo + safe area top */}
      <div
        className="md:hidden"
        style={{ height: 'calc(3rem + env(safe-area-inset-top, 0px))' }}
      />
    </>
  )
}