import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { PWA_THEME } from '@/lib/pwaTheme'
import './globals.css'

const headingFont = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-heading',
})

const sansFont = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nos2reais.com.br'),
  title: 'Nós 2 Reais',
  description: 'Finanças do casal, juntos e de verdade.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nós 2 Reais',
    startupImage: '/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
  icons: {
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: ['/icon-192.png'],
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: PWA_THEME.themeColor,
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${headingFont.variable} ${sansFont.variable} font-sans`}>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
