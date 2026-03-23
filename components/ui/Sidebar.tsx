'use client'

import Link      from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient }           from '@/lib/supabase/client'
import { useAccounts }            from '@/hooks/useAccounts'
import { NotificationBell }       from '@/components/ui/NotificationBell'
import { useState }               from 'react'
import { useCouple }              from '@/hooks/useCouple'

const baseNavItems = [
  { href: '/',           label: 'Dashboard',    icon: '⊞' },
  { href: '/transacoes', label: 'Transacoes',   icon: '↕' },
  { href: '/contas',     label: 'Contas',       icon: '◫' },
  { href: '/categorias', label: 'Categorias',   icon: '◈' },
  { href: '/relatorios', label: 'Relatorios',   icon: '▤' },
  { href: '/objetivos',  label: 'Objetivos',    icon: '🎯' },
  { href: '/casal',      label: 'Perfil Casal', icon: '💑' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: accounts = [] } = useAccounts()
  const hasCards = accounts.some(a => a.type === 'credit' && a.is_active)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Injeta item Cartoes entre Contas e Categorias apenas se houver cartoes
  const navItems = hasCards
    ? [
        ...baseNavItems.slice(0, 3),
        { href: '/cartoes', label: 'Cartoes', icon: '💳' },
        ...baseNavItems.slice(3),
      ]
    : baseNavItems

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
              <span className={`text-[13px] w-4 text-center ${isActive ? 'opacity-90' : 'opacity-70'}`}>
                {item.icon}
              </span>
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
          <span className="text-[13px] w-4 text-center opacity-70">→</span>
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
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