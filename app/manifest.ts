import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nós 2 Reais',
    short_name: 'N2R',
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
        src: '/n2r-simbolo-principal-claro-V1.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/n2r-simbolo-principal-claro-V1.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
