import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
})

const readRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(240, '1 m'),
})

const READ_DECISION_TTL_MS = 15_000
const READ_CACHE_MAX_ENTRIES = 5_000
const readAllowCache = new Map<string, number>()

type RatelimitDecision = Awaited<ReturnType<typeof ratelimit.limit>>

function pruneReadCache(now: number) {
  if (readAllowCache.size <= READ_CACHE_MAX_ENTRIES) return
  for (const [key, expiresAt] of readAllowCache) {
    if (expiresAt <= now) {
      readAllowCache.delete(key)
    }
  }
}

export async function limitFrequentRead(identifier: string, scope = 'read'): Promise<RatelimitDecision> {
  const cacheKey = `${scope}:${identifier}`
  const now = Date.now()
  const cachedUntil = readAllowCache.get(cacheKey)

  if (cachedUntil && cachedUntil > now) {
    return {
      success: true,
      limit: 240,
      remaining: 1,
      reset: Math.floor(cachedUntil / 1000),
    } as RatelimitDecision
  }

  const decision = await readRatelimit.limit(cacheKey)
  if (decision.success) {
    readAllowCache.set(cacheKey, now + READ_DECISION_TTL_MS)
    pruneReadCache(now)
  }

  return decision
}
