import { Sidebar }            from '@/components/ui/Sidebar'
import { PartnerViewToggle }  from '@/components/ui/PartnerViewToggle'
import { PartnerViewBanner }  from '@/components/ui/PartnerViewBanner'
import { InstallBanner }      from '@/components/ui/InstallBanner'
import Image                  from 'next/image'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#FDFCF0]">
      <Sidebar />
      <main
        className="flex-1 md:ml-60 min-h-screen"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Toggle de visão do parceiro — aparece apenas quando há vínculo ativo */}
        <div className="flex justify-end px-6 pt-5 md:pt-6">
          <PartnerViewToggle />
        </div>
        <div className="px-6 pb-2">
          <PartnerViewBanner />
        </div>
        {children}
        <footer className="px-6 py-8 mt-6 border-t border-[#D1D5DB]">
          <Image
            src="/n2r-wordmark-horizontal-v1.png"
            alt="Nós 2 Reais"
            width={220}
            height={40}
          />
        </footer>
      </main>
      {/* Banner de instalação iOS — só aparece no Safari/iOS fora do modo standalone */}
      <InstallBanner />
    </div>
  )
}
