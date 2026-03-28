import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { PWA_THEME } from '@/lib/pwaTheme'
import { buildSocialMetadata } from '@/lib/socialMeta'
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
  ...buildSocialMetadata({
    title: 'Nós 2 Reais',
    description: 'Finanças do casal, juntos e de verdade.',
    imagePath: '/social/og-default.svg',
    imageAlt: 'Nós 2 Reais - Finanças do casal',
  }),
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nós 2 Reais',
    startupImage: '/icons/icon-512.png',
  },
  formatDetection: { telephone: false },
  icons: {
    apple: [{ url: '/icons/apple-touch-icon.png' }],
    shortcut: ['/icons/icon-192.png'],
    icon: [
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
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
