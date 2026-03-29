import { afterEach, describe, expect, it } from 'vitest'
import { resolvePasswordRecoveryRedirect } from '@/lib/passwordRecoveryRedirect'

const originalEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_URL: process.env.VERCEL_URL,
}

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = originalEnv.NEXT_PUBLIC_APP_URL
  process.env.NEXT_PUBLIC_SITE_URL = originalEnv.NEXT_PUBLIC_SITE_URL
  process.env.VERCEL_URL = originalEnv.VERCEL_URL
})

describe('resolvePasswordRecoveryRedirect', () => {
  it('prioriza origin confiavel da requisicao', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.nos2reais.com.br'

    const redirect = resolvePasswordRecoveryRedirect({
      origin: 'https://www.nos2reais.com.br',
      host: 'www.nos2reais.com.br',
      forwardedHost: null,
      forwardedProto: 'https',
    })

    expect(redirect).toBe('https://www.nos2reais.com.br/atualizar-senha')
  })

  it('usa host encaminhado quando origin nao existe', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.nos2reais.com.br'

    const redirect = resolvePasswordRecoveryRedirect({
      origin: null,
      host: 'www.nos2reais.com.br',
      forwardedHost: 'localhost:3000',
      forwardedProto: 'http',
    })

    expect(redirect).toBe('http://localhost:3000/atualizar-senha')
  })

  it('ignora host nao permitido e cai para app url confiavel', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.nos2reais.com.br'

    const redirect = resolvePasswordRecoveryRedirect({
      origin: 'https://evil.example.com',
      host: 'evil.example.com',
      forwardedHost: null,
      forwardedProto: 'https',
    })

    expect(redirect).toBe('https://www.nos2reais.com.br/atualizar-senha')
  })

  it('usa vercel url quando necessario', () => {
    process.env.NEXT_PUBLIC_APP_URL = ''
    process.env.VERCEL_URL = 'tofinanceapp-git-feature-x.vercel.app'

    const redirect = resolvePasswordRecoveryRedirect({
      origin: null,
      host: 'tofinanceapp-git-feature-x.vercel.app',
      forwardedHost: null,
      forwardedProto: 'https',
    })

    expect(redirect).toBe('https://tofinanceapp-git-feature-x.vercel.app/atualizar-senha')
  })
})

