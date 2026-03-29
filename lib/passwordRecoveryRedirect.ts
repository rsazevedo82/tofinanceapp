type RedirectMeta = {
  origin: string | null
  host: string | null
  forwardedHost: string | null
  forwardedProto: string | null
}

function safeUrl(value: string | null | undefined): URL | null {
  if (!value) return null
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function safeHost(value: string | null | undefined): string | null {
  if (!value) return null
  return value.trim().toLowerCase()
}

function isAllowedRedirectHost(host: string): boolean {
  const appUrlHost = safeUrl(process.env.NEXT_PUBLIC_APP_URL?.trim())?.host.toLowerCase()
  const siteUrlHost = safeUrl(process.env.NEXT_PUBLIC_SITE_URL?.trim())?.host.toLowerCase()
  const vercelHost = safeHost(process.env.VERCEL_URL)

  const allowedHosts = new Set(
    [
      'www.nos2reais.com.br',
      'nos2reais.com.br',
      'localhost:3000',
      'localhost:3001',
      '127.0.0.1:3000',
      '127.0.0.1:3001',
      appUrlHost,
      siteUrlHost,
      vercelHost,
    ].filter(Boolean)
  )

  return allowedHosts.has(host.toLowerCase())
}

function buildRedirectUrl(base: string): string {
  return `${base.replace(/\/$/, '')}/atualizar-senha`
}

export function resolvePasswordRecoveryRedirect(meta: RedirectMeta): string {
  const originUrl = safeUrl(meta.origin)
  if (originUrl && isAllowedRedirectHost(originUrl.host)) {
    return buildRedirectUrl(originUrl.origin)
  }

  const candidateHost = safeHost(meta.forwardedHost) ?? safeHost(meta.host)
  if (candidateHost && isAllowedRedirectHost(candidateHost)) {
    const proto = meta.forwardedProto === 'http' ? 'http' : 'https'
    return buildRedirectUrl(`${proto}://${candidateHost}`)
  }

  const appUrl = safeUrl(process.env.NEXT_PUBLIC_APP_URL?.trim())
  if (appUrl && isAllowedRedirectHost(appUrl.host)) {
    return buildRedirectUrl(appUrl.origin)
  }

  return buildRedirectUrl('https://www.nos2reais.com.br')
}

