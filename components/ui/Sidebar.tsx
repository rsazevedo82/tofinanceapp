'use client'

import Link      from 'next/link'
import Image     from 'next/image'
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
      {/* Marca principal */}
      <div className="flex items-center justify-between px-5 py-5 mb-2">
        <Image
          src="/n2r-logo-completo-horizontal-cor-V1.png"
          alt="Nós 2 Reais"
          width={164}
          height={34}
          priority
        />
        <NotificationBell />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        <p className="section-heading px-2">Menu</p>
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
                className="db-row gap-3 text-sm w-full"
                style={{ color: '#D1D5DB' }}
              >
                <Icon size={18} className="w-4 shrink-0 opacity-40" />
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
              className={`db-row gap-3 text-sm w-full font-medium transition-colors ${
                isActive ? 'text-[#0F172A]' : 'text-[#6B7280] hover:text-[#0F172A]'
              }`}
              style={isActive ? { background: 'rgba(255,127,80,0.1)' } : undefined}
            >
              <Icon size={18} className="w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer — perfil */}
      <div
        className="px-3 pb-5 pt-4 space-y-1"
        style={{ borderTop: '1px solid #D1D5DB' }}
      >
        <Link
          href="/perfil"
          onClick={() => setMobileOpen(false)}
          className={`db-row gap-3 text-sm w-full font-medium transition-colors ${
            pathname === '/perfil' ? 'text-[#0F172A]' : 'text-[#6B7280] hover:text-[#0F172A]'
          }`}
          style={pathname === '/perfil' ? { background: 'rgba(255,127,80,0.1)' } : undefined}
        >
          {profile?.name || profile?.email ? (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ background: 'rgba(255,127,80,0.15)', color: '#FF7F50' }}
            >
              {(profile?.name ?? profile?.email ?? '?').charAt(0).toUpperCase()}
            </div>
          ) : (
            <FcManager size={18} className="w-4 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-[#0F172A] leading-tight">
              {profile?.name ?? 'Meu perfil'}
            </p>
            {profile?.email && (
              <p className="truncate text-[11px] leading-tight text-[#6B7280]">
                {profile.email}
              </p>
            )}
          </div>
        </Link>

        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="db-row gap-3 text-sm w-full transition-colors text-[#6B7280] hover:text-[#EF4444]"
        >
          <span className="w-4 text-center text-[13px] shrink-0">↪</span>
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
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setLockedInfo(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 space-y-4 bg-white"
            style={{ border: '1px solid #D1D5DB', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <h3 className="font-bold text-[#0F172A]">{lockedInfo.label} indisponível</h3>
            </div>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              {lockedInfo.message}
            </p>
            <p className="text-sm text-[#FF7F50] font-medium">
              {lockedInfo.hint}
            </p>
            <button
              onClick={() => setLockedInfo(null)}
              className="btn-primary w-full text-sm justify-center"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Desktop */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col z-30 bg-[#FDFCF0]"
        style={{
          borderRight: '1px solid #D1D5DB',
          paddingTop:  'env(safe-area-inset-top,  0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
        }}
      >
        <NavContent />
      </aside>

      {/* Mobile header */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 flex flex-col justify-end px-5 z-30 bg-[#FDFCF0]"
        style={{
          borderBottom: '1px solid #D1D5DB',
          paddingTop:   'env(safe-area-inset-top, 0px)',
          minHeight:    'calc(3.5rem + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center justify-between h-14">
          <Image
            src="/n2r-logo-completo-horizontal-cor-V1.png"
            alt="Nós 2 Reais"
            width={138}
            height={28}
            priority
          />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={() => setMobileOpen(true)}
              className="touch-target text-[#6B7280] hover:text-[#0F172A] transition-colors p-2 text-xl"
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
            className="absolute inset-0 bg-[#0F172A]/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="relative w-60 flex flex-col h-full bg-[#FDFCF0]"
            style={{ borderRight: '1px solid #D1D5DB' }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="touch-target absolute top-4 right-4 text-[#6B7280] hover:text-[#0F172A] text-sm p-2"
            >✕</button>
            <NavContent />
          </div>
        </div>
      )}

      {/* Espaçador mobile */}
      <div
        className="md:hidden"
        style={{ height: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
      />
    </>
  )
}
