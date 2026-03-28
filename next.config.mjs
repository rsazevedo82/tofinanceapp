import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  // Evita cache agressivo de navegação que pode causar mismatch de hidratação
  // quando há deploy com chunks novos.
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  // Fallback explícito para navegação quando estiver offline
  fallbacks: {
    document: '/offline',
  },
  // Service worker ativo apenas em produção
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    // Força atualização mais previsível de SW e remove caches obsoletos
    clientsClaim: true,
    skipWaiting: true,
    cleanupOutdatedCaches: true,
    navigationPreload: true,
    navigateFallback: '/offline',
    runtimeCaching: [
      {
        // API (incluindo dados financeiros) sem cache no Service Worker
        urlPattern: /^\/api\//,
        handler: 'NetworkOnly',
      },
      {
        // Chunks estáticos do Next.js: seguros para cache runtime
        urlPattern: /^\/_next\/static\/.*/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-static-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        // Assets estáticos públicos (ícones/imagens/fontes): seguros para cache
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'public-static-assets',
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const supabaseHost = supabaseUrl.replace('https://', '')

    const ContentSecurityPolicy = [
      "default-src 'self'",

      // Next.js requer unsafe-inline para scripts internos
      // unsafe-eval necessário para desenvolvimento — removido em produção
      process.env.NODE_ENV === 'development'
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://challenges.cloudflare.com"
        : "script-src 'self' 'unsafe-inline' https://vercel.live https://challenges.cloudflare.com",

      // Supabase API + WebSocket para realtime
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://vercel.live https://challenges.cloudflare.com`,

      // Estilos inline necessários para Tailwind
      "style-src 'self' 'unsafe-inline'",

      // Imagens — self + data URIs + blob para previews futuros
      "img-src 'self' data: blob:",

      // Fontes — Google Fonts se necessário no futuro
      "font-src 'self'",

      // Iframes — nenhum permitido (substitui X-Frame-Options)
      "frame-ancestors 'none'",
      // Turnstile renderiza desafio em iframe próprio
      "frame-src 'self' https://challenges.cloudflare.com",

      // Formulários só submetem para o próprio domínio
      "form-action 'self'",

      // Base URI restrita
      "base-uri 'self'",

      // Service worker precisa de worker-src
      "worker-src 'self'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // X-XSS-Protection removido — deprecated desde Chrome 78 (2021)
          // Substituído pelo Content-Security-Policy acima
        ],
      },
    ]
  },
}

export default withPWA(nextConfig)
