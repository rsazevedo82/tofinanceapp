import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { QueryProvider } from '@/components/providers/QueryProvider'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Nós 2 Reais',
  description: 'Finanças do casal, juntos e de verdade.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nós 2 Reais',
    startupImage: '/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
  icons: {
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#1c1c1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`dark ${geist.variable} font-sans`}>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}