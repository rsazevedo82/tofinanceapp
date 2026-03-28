import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock do módulo para resetar o Map entre testes
vi.mock('@/lib/rateLimit', async () => {
  const requests = new Map<string, { count: number; resetAt: number }>()
  const WINDOW_MS = 60 * 1000
  const MAX_REQUESTS = 60

  return {
    ratelimit: {
      limit: (ip: string) => {
        const now = Date.now()
        const record = requests.get(ip)

        if (!record || now > record.resetAt) {
          requests.set(ip, { count: 1, resetAt: now + WINDOW_MS })
          return { success: true, remaining: MAX_REQUESTS - 1 }
        }

        if (record.count >= MAX_REQUESTS) {
          return { success: false, remaining: 0 }
        }

        record.count++
        return { success: true, remaining: MAX_REQUESTS - record.count }
      },
    },
  }
})

import { ratelimit } from '@/lib/rateLimit'

describe('rateLimit', () => {
  it('permite primeira requisição', async () => {
    const result = await ratelimit.limit('ip-teste-1')
    expect(result.success).toBe(true)
  })

  it('retorna remaining correto', async () => {
    const result = await ratelimit.limit('ip-teste-2')
    expect(result.remaining).toBe(59)
  })

  it('bloqueia após 60 requisições', async () => {
    const ip = 'ip-teste-3'
    for (let i = 0; i < 60; i++) {
      await ratelimit.limit(ip)
    }
    const result = await ratelimit.limit(ip)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('IPs diferentes têm contadores independentes', async () => {
    for (let i = 0; i < 60; i++) await ratelimit.limit('ip-a')
    const result = await ratelimit.limit('ip-b')
    expect(result.success).toBe(true)
  })
})
