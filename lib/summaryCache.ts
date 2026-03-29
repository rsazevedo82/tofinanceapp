import { Redis } from '@upstash/redis'

const CACHE_VERSION_KEY_PREFIX = 'cache:summary:version'
const CACHE_KEY_PREFIX = 'cache:summary'
const DASHBOARD_TTL_SECONDS = 120
const REPORTS_TTL_SECONDS = 180

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

function versionKey(userId: string): string {
  return `${CACHE_VERSION_KEY_PREFIX}:${userId}`
}

function entryKey(params: {
  scope: 'dashboard' | 'reports'
  userId: string
  period: string
  version: number
}): string {
  return `${CACHE_KEY_PREFIX}:${params.scope}:u:${params.userId}:p:${params.period}:v:${params.version}`
}

async function getCacheVersion(userId: string): Promise<number> {
  if (!redis) return 1
  try {
    const raw = await redis.get<number | string>(versionKey(userId))
    if (raw == null) return 1
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
  } catch {
    return 1
  }
}

export async function invalidateSummaryCacheForUser(userId: string): Promise<void> {
  if (!redis) return
  try {
    await redis.incr(versionKey(userId))
  } catch {
    // no-op para nao afetar fluxos de escrita
  }
}

export async function getCachedDashboard<T>(params: {
  userId: string
  period: string
}): Promise<T | null> {
  if (!redis) return null
  try {
    const version = await getCacheVersion(params.userId)
    const key = entryKey({
      scope: 'dashboard',
      userId: params.userId,
      period: params.period,
      version,
    })
    const raw = await redis.get<string>(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setCachedDashboard<T>(params: {
  userId: string
  period: string
  value: T
}): Promise<void> {
  if (!redis) return
  try {
    const version = await getCacheVersion(params.userId)
    const key = entryKey({
      scope: 'dashboard',
      userId: params.userId,
      period: params.period,
      version,
    })
    await redis.set(key, JSON.stringify(params.value), { ex: DASHBOARD_TTL_SECONDS })
  } catch {
    // no-op para nao afetar resposta principal
  }
}

export async function getCachedReports<T>(params: {
  userId: string
  period: string
}): Promise<T | null> {
  if (!redis) return null
  try {
    const version = await getCacheVersion(params.userId)
    const key = entryKey({
      scope: 'reports',
      userId: params.userId,
      period: params.period,
      version,
    })
    const raw = await redis.get<string>(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setCachedReports<T>(params: {
  userId: string
  period: string
  value: T
}): Promise<void> {
  if (!redis) return
  try {
    const version = await getCacheVersion(params.userId)
    const key = entryKey({
      scope: 'reports',
      userId: params.userId,
      period: params.period,
      version,
    })
    await redis.set(key, JSON.stringify(params.value), { ex: REPORTS_TTL_SECONDS })
  } catch {
    // no-op para nao afetar resposta principal
  }
}
