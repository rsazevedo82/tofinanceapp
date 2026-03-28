import type { MetadataRoute } from 'next'
import { PWA_THEME } from '@/lib/pwaTheme'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nós 2 Reais',
    short_name: 'N2R',
    description: 'Finanças do casal, juntos e de verdade.',
    id: '/',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: PWA_THEME.backgroundColor,
    theme_color: PWA_THEME.themeColor,
    categories: ['finance', 'productivity'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
