'use client'

import Link      from 'next/link'
import Image     from 'next/image'
import { usePathname } from 'next/navigation'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useEffect, useState }         from 'react'
import { useCouple }        from '@/hooks/useCouple'
import { useProfile, useLogout } from '@/hooks/useProfile'
import {
  ArrowRightLeft,
  BarChart3,
  CreditCard,
  HandCoins,
  Home,
  List,
  Menu,
  Target,
  UserRound,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { SeverityIcon } from '@/components/ui/SeverityIcon'

interface NavItem {
  href:         string
  label:        string
  context:      string
  icon:         LucideIcon
  locked?:      boolean
  lockMessage?: string
  lockHint?:    string
}

export function Sidebar() {
  const mobileDrawerId = 'mobile-navigation-drawer'
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileMounted, setMobileMounted] = useState(false)
  const [lockedInfo, setLockedInfo] = useState<{ label: string; message: string; hint: string } | null>(null)

  const { data: couple }  = useCouple()
  const { data: profile } = useProfile()
  const logout            = useLogout()
  const hasCouple = !!couple

  function openMobileDrawer() {
    setMobileMounted(true)
    requestAnimationFrame(() => setMobileOpen(true))
  }

  function closeMobileDrawer() {
    setMobileOpen(false)
    window.setTimeout(() => setMobileMounted(false), 220)
  }

  useEffect(() => {
    if (!mobileMounted) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileDrawer()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileMounted])

  const navItems: NavItem[] = [
    { href: '/',           label: 'Visão geral',         context: 'Resumo financeiro principal', icon: Home },
    { href: '/transacoes', label: 'Gastos',              context: 'Entradas e saídas do período', icon: ArrowRightLeft },
    { href: '/contas',     label: 'Contas',              context: 'Saldos e contas disponíveis', icon: Wallet },
    { href: '/cartoes',    label: 'Cartões',             context: 'Limites, faturas e uso atual', icon: CreditCard },
    { href: '/categorias', label: 'Categorias',          context: 'Organização das movimentações', icon: List },
    { href: '/relatorios', label: 'Relatórios',          context: 'Análises e comparativos', icon: BarChart3 },
    { href: '/objetivos',  label: 'Objetivos',           context: 'Metas e progresso acumulado', icon: Target },
    {
      href:        '/divisao',
      label:       'Divisão de despesas',
      context:     'Pendências e histórico do casal',
      icon:        HandCoins,
      locked:      !hasCouple,
      lockMessage: 'A divisão de despesas só está disponível para casais vinculados.',
      lockHint:    'Acesse Conexão do casal e convide seu parceiro(a) para desbloquear.',
    },
    { href: '/casal',      label: 'Conexão do casal',    context: 'Convites e vínculo com parceiro(a)', icon: Users },
  ]

  const activeNavItem =
    navItems.find(item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) ??
    (pathname === '/perfil'
      ? { href: '/perfil', label: 'Perfil', context: 'Dados da sua conta', icon: UserRound }
      : null)

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Marca principal */}
      <div className="flex items-center justify-between px-5 py-5 mb-2">
        <Link href="/" aria-label="Ir para Visão geral">
          <Image
            src="/n2r-logo-completo-horizontal-cor-V1.png"
            alt="Nós 2 Reais"
            width={164}
            height={34}
            priority
          />
        </Link>
        <NotificationBell />
      </div>

      {mobile && activeNavItem ? (
        <div className="mx-3 mb-3 rounded-xl px-3 py-2.5 bg-white border border-[#D1D5DB]">
          <p className="data-label mb-0.5">Seção atual</p>
          <p className="text-sm font-semibold text-[#0F172A]">{activeNavItem.label}</p>
          <p className="text-xs text-[#334155]">{activeNavItem.context}</p>
        </div>
      ) : null}

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
                className="db-row interactive-control gap-3 text-sm w-full"
                style={{ color: '#D1D5DB' }}
              >
                <Icon size={18} className="w-4 shrink-0 opacity-40" />
                <span className="flex-1 text-left">{item.label}</span>
                <span className="badge-status badge-status-blocked">bloqueado</span>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => closeMobileDrawer()}
              className={`db-row interactive-control gap-3 text-sm w-full font-medium transition-colors ${
                isActive ? 'text-[#0F172A]' : 'text-[#334155] hover:text-[#0F172A]'
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
          onClick={() => closeMobileDrawer()}
          className={`db-row interactive-control gap-3 text-sm w-full font-medium transition-colors ${
            pathname === '/perfil' ? 'text-[#0F172A]' : 'text-[#334155] hover:text-[#0F172A]'
          }`}
          style={pathname === '/perfil' ? { background: 'rgba(255,127,80,0.1)' } : undefined}
        >
          {profile?.name || profile?.email ? (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'rgba(255,127,80,0.15)', color: '#FF7F50' }}
            >
              {(profile?.name ?? profile?.email ?? '?').charAt(0).toUpperCase()}
            </div>
          ) : (
            <UserRound size={18} className="w-4 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-[#0F172A] leading-tight">
              {profile?.name ?? 'Meu perfil'}
            </p>
            {profile?.email && (
              <p className="truncate text-xs leading-tight text-[#334155]">
                {profile.email}
              </p>
            )}
          </div>
        </Link>

        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="db-row interactive-control gap-3 text-sm w-full transition-colors text-[#334155] hover:text-[#EF4444]"
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
              <span className="h-9 w-9 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-[#991B1B]">
                <SeverityIcon level="blocked" className="size-4" aria-hidden />
              </span>
              <h3 className="font-bold text-[#0F172A]">{lockedInfo.label} indisponível</h3>
            </div>
            <p className="text-sm leading-relaxed alert-box alert-box-blocked">
              {lockedInfo.message}
            </p>
            <p className="text-sm text-[#C2410C] font-medium">
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
          minHeight:    'calc(5rem + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center justify-between h-14">
          <Link href="/" aria-label="Ir para Visão geral">
            <Image
              src="/n2r-logo-completo-horizontal-cor-V1.png"
              alt="Nós 2 Reais"
              width={138}
              height={28}
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={openMobileDrawer}
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileOpen}
              aria-controls={mobileDrawerId}
              aria-haspopup="dialog"
              className="touch-target interactive-control text-[#334155] hover:text-[#0F172A] transition-colors p-2 rounded-lg"
            >
              <Menu size={20} aria-hidden />
            </button>
          </div>
        </div>
        {activeNavItem ? (
          <div className="pb-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#64748B] font-semibold">Seção atual</p>
            <p className="text-sm font-semibold text-[#0F172A] leading-tight">{activeNavItem.label}</p>
          </div>
        ) : null}
      </header>

      {/* Mobile drawer */}
      {mobileMounted && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-200 ${
              mobileOpen ? 'opacity-100 bg-[#0F172A]/30' : 'opacity-0 bg-[#0F172A]/0'
            }`}
            onClick={closeMobileDrawer}
            aria-hidden="true"
          />
          <div
            id={mobileDrawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className={`relative w-60 flex flex-col h-full bg-[#FDFCF0] transition-transform duration-200 ease-out ${
              mobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ borderRight: '1px solid #D1D5DB' }}
          >
            <button
              onClick={closeMobileDrawer}
              aria-label="Fechar menu de navegação"
              className="touch-target interactive-control absolute top-4 right-4 text-[#334155] hover:text-[#0F172A] text-sm p-2 rounded-lg"
            >
              <X size={18} aria-hidden />
            </button>
            <NavContent mobile />
          </div>
        </div>
      )}

      {/* Espaçador mobile */}
      <div
        className="md:hidden"
        style={{ height: 'calc(5rem + env(safe-area-inset-top, 0px))' }}
      />
    </>
  )
}

