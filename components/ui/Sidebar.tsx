'use client'

import Link      from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient }           from '@/lib/supabase/client'
import { NotificationBell }       from '@/components/ui/NotificationBell'
import { useState }               from 'react'
import { useCouple }              from '@/hooks/useCouple'
import {
  LayoutDashboard,
  ArrowUpDown,
  Landmark,
  CreditCard,
  Tag,
  BarChart2,
  Target,
  Split,
  Users,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  href:         string
  label:        string
  icon:         LucideIcon
  locked?:      boolean
  lockMessage?: string
  lockHint?:    string
}

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lockedInfo, setLockedInfo] = useState<{ label: string; message: string; hint: string } | null>(null)

  const { data: couple } = useCouple()
  const hasCouple = !!couple

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems: NavItem[] = [
    { href: '/',           label: 'Visão geral',         icon: LayoutDashboard },
    { href: '/transacoes', label: 'Gastos',               icon: ArrowUpDown },
    { href: '/contas',     label: 'Contas',               icon: Landmark },
    { href: '/cartoes',    label: 'Cartões',              icon: CreditCard },
    { href: '/categorias', label: 'Categorias',           icon: Tag },
    { href: '/relatorios', label: 'Relatórios',           icon: BarChart2 },
    { href: '/objetivos',  label: 'Objetivos',            icon: Target },
    {
      href:        '/divisao',
      label:       'Divisão de despesas',
      icon:        Split,
      locked:      !hasCouple,
      lockMessage: 'A divisão de despesas só está disponível para casais vinculados.',
      lockHint:    'Acesse Conexão do casal e convide seu parceiro(a) para desbloquear.',
    },
    { href: '/casal',      label: 'Conexão do casal',    icon: Users },
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
                <Icon size={14} className="w-4 shrink-0 opacity-40" />
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
              <Icon size={14} className={`w-4 shrink-0 ${isActive ? 'opacity-90' : 'opacity-70'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-1 pb-3 border-t border-white/[0.05] pt-3">
        <button
          onClick={handleLogout}
          className="db-row gap-2 text-sm w-full text-[#9ca3af] hover:text-[#e8e6e1] transition-colors"
        >
          <LogOut size={14} className="w-4 shrink-0 opacity-70" />
          Sair
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
        }}
      >
        <NavContent />
      </aside>

      {/* Mobile header */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 h-12 flex items-center justify-between px-4 z-30"
        style={{
          background:     'rgba(17,17,16,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom:   '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
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

      <div className="md:hidden h-12" />
    </>
  )
}