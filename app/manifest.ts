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
        src: '/icons/icon-192.png',
        type: 'image/png',
        sizes: '192x192',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'any',
      },
    ],
  }
}
