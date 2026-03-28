import { Sidebar }            from '@/components/ui/Sidebar'
import { PartnerViewToggle }  from '@/components/ui/PartnerViewToggle'
import { PartnerViewBanner }  from '@/components/ui/PartnerViewBanner'
import { InstallBanner }      from '@/components/ui/InstallBanner'
import Image                  from 'next/image'
import Link                   from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#FDFCF0]">
      <Sidebar />
      <main
        className="flex-1 md:ml-60 min-h-screen"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Toggle de visão do parceiro — aparece apenas quando há vínculo ativo */}
        <div className="flex justify-end px-4 sm:px-6 pt-5 md:pt-6">
          <PartnerViewToggle />
        </div>
        <div className="px-4 sm:px-6 pb-2">
          <PartnerViewBanner />
        </div>
        <div className="motion-enter">
          {children}
        </div>
        <footer className="px-4 sm:px-6 py-8 mt-6 border-t border-[#D1D5DB]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" aria-label="Ir para Visão geral">
              <Image
                src="/n2r-wordmark-horizontal-v1.png"
                alt="Nós 2 Reais"
                width={220}
                height={40}
              />
            </Link>
            <Link
              href="/politica-de-privacidade"
              className="text-sm text-[#334155] hover:text-[#C2410C] transition-colors"
            >
              Política de Privacidade
            </Link>
          </div>
        </footer>
      </main>
      {/* Banner de instalação iOS — só aparece no Safari/iOS fora do modo standalone */}
      <InstallBanner />
    </div>
  )
}

