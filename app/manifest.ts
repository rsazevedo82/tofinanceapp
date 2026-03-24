import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nós Dois Reais',
    short_name: 'N2 Reais',
    description: 'Finanças do casal, juntos e de verdade.',
    id: '/',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1c1c1a',
    theme_color: '#1c1c1a',
    categories: ['finance', 'productivity'],
    icons: [
      {
        src: '/api/icons/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/api/icons/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
