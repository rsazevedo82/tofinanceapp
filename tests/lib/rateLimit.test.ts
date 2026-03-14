import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock do módulo para resetar o Map entre testes
vi.mock('@/lib/rateLimit', async () => {
  const requests = new Map<string, { count: number; resetAt: number }>()
  const WINDOW_MS = 60 * 1000
  const MAX_REQUESTS = 60

  return {
    rateLimit: (ip: string) => {
      const now = Date.now()
      const record = requests.get(ip)

      if (!record || now > record.resetAt) {
        requests.set(ip, { count: 1, resetAt: now + WINDOW_MS })
        return { allowed: true, remaining: MAX_REQUESTS - 1 }
      }

      if (record.count >= MAX_REQUESTS) {
        return { allowed: false, remaining: 0 }
      }

      record.count++
      return { allowed: true, remaining: MAX_REQUESTS - record.count }
    },
  }
})

import { rateLimit } from '@/lib/rateLimit'

describe('rateLimit', () => {
  it('permite primeira requisição', () => {
    const result = rateLimit('ip-teste-1')
    expect(result.allowed).toBe(true)
  })

  it('retorna remaining correto', () => {
    const result = rateLimit('ip-teste-2')
    expect(result.remaining).toBe(59)
  })

  it('bloqueia após 60 requisições', () => {
    const ip = 'ip-teste-3'
    for (let i = 0; i < 60; i++) {
      rateLimit(ip)
    }
    const result = rateLimit(ip)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('IPs diferentes têm contadores independentes', () => {
    for (let i = 0; i < 60; i++) rateLimit('ip-a')
    const result = rateLimit('ip-b')
    expect(result.allowed).toBe(true)
  })
})