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
        src: '/n2r-simbolo-principal-claro-V1.png',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/n2r-simbolo-principal-claro-V1.png',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/n2r-simbolo-principal-claro-V1.png',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
