import type { Metadata, Viewport } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { QueryProvider } from '@/components/providers/QueryProvider'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-heading',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nos2reais.com.br'),
  title: 'Nós 2 Reais',
  description: 'Finanças do casal, juntos e de verdade.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nós 2 Reais',
    startupImage: '/n2r-simbolo-principal-claro-V1.png',
  },
  formatDetection: { telephone: false },
  icons: {
    apple: [{ url: '/n2r-simbolo-principal-claro-V1.png', sizes: '180x180' }],
    shortcut: ['/n2r-simbolo-principal-claro-V1.png'],
    icon: [
      { url: '/n2r-simbolo-principal-claro-V1.png', sizes: '192x192', type: 'image/png' },
      { url: '/n2r-simbolo-principal-claro-V1.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#FDFCF0',
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${montserrat.variable} ${inter.variable} font-sans`}>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
