import { Sidebar }            from '@/components/ui/Sidebar'
import { PartnerViewToggle }  from '@/components/ui/PartnerViewToggle'
import { PartnerViewBanner }  from '@/components/ui/PartnerViewBanner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#111110]">
      <Sidebar />
      <main className="flex-1 md:ml-56 min-h-screen">
        {/* Toggle de visão do parceiro — aparece apenas quando há vínculo ativo */}
        <div className="flex justify-end px-6 pt-5 md:pt-6">
          <PartnerViewToggle />
        </div>
        <div className="px-6 pb-2">
          <PartnerViewBanner />
        </div>
        {children}
      </main>
    </div>
  )
}
