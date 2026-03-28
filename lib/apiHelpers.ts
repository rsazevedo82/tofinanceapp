// lib/apiHelpers.ts
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { headers }   from 'next/headers'
import { NextResponse } from 'next/server'

type RoutePolicy = {
  ip: { limit: number; window: `${number} m` | `${number} h` }
  user: { limit: number; window: `${number} m` | `${number} h` }
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ROUTE_POLICIES: Record<string, RoutePolicy> = {
  default: {
    ip: { limit: 120, window: '1 m' },
    user: { limit: 240, window: '1 m' },
  },
  'accounts:get': {
    ip: { limit: 120, window: '1 m' },
    user: { limit: 180, window: '1 m' },
  },
  'accounts:write': {
    ip: { limit: 60, window: '1 m' },
    user: { limit: 90, window: '1 m' },
  },
  'categories:get': {
    ip: { limit: 120, window: '1 m' },
    user: { limit: 180, window: '1 m' },
  },
  'categories:write': {
    ip: { limit: 60, window: '1 m' },
    user: { limit: 90, window: '1 m' },
  },
  'profile:get': {
    ip: { limit: 60, window: '1 m' },
    user: { limit: 120, window: '1 m' },
  },
  'profile:write': {
    ip: { limit: 30, window: '1 m' },
    user: { limit: 45, window: '1 m' },
  },
  'invoices:get': {
    ip: { limit: 90, window: '1 m' },
    user: { limit: 120, window: '1 m' },
  },
  'invoices:pay': {
    ip: { limit: 30, window: '1 m' },
    user: { limit: 45, window: '1 m' },
  },
  'reports:get': {
    ip: { limit: 45, window: '1 m' },
    user: { limit: 60, window: '1 m' },
  },
  'cards:overview': {
    ip: { limit: 90, window: '1 m' },
    user: { limit: 120, window: '1 m' },
  },
  'transactions:write': {
    ip: { limit: 60, window: '1 m' },
    user: { limit: 90, window: '1 m' },
  },
  'notifications:write': {
    ip: { limit: 60, window: '1 m' },
    user: { limit: 120, window: '1 m' },
  },
  'couple:write': {
    ip: { limit: 20, window: '1 m' },
    user: { limit: 30, window: '1 m' },
  },
}

const limiterCache = new Map<string, Ratelimit>()

function getLimiter(prefix: string, limit: number, window: `${number} m` | `${number} h`): Ratelimit {
  const cacheKey = `${prefix}:${limit}:${window}`
  const existing = limiterCache.get(cacheKey)
  if (existing) return existing

  const created = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix,
  })
  limiterCache.set(cacheKey, created)
  return created
}

export async function getIP(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

export async function checkRateLimitByIP(routeKey = 'default'): Promise<NextResponse<never> | null> {
  const policy = ROUTE_POLICIES[routeKey] ?? ROUTE_POLICIES.default
  const limiter = getLimiter(`ratelimit:${routeKey}:ip`, policy.ip.limit, policy.ip.window)
  const { success } = await limiter.limit(await getIP())
  if (!success) {
    return NextResponse.json(
      { data: null, error: 'Muitas requisicoes para este endpoint. Tente novamente em instantes.' },
      { status: 429 }
    ) as NextResponse<never>
  }
  return null
}

export async function checkRateLimitByUser(
  routeKey: string,
  userId: string
): Promise<NextResponse<never> | null> {
  const policy = ROUTE_POLICIES[routeKey] ?? ROUTE_POLICIES.default
  const limiter = getLimiter(`ratelimit:${routeKey}:user`, policy.user.limit, policy.user.window)
  const { success } = await limiter.limit(userId)
  if (!success) {
    return NextResponse.json(
      { data: null, error: 'Muitas requisicoes da sua conta. Tente novamente em instantes.' },
      { status: 429 }
    ) as NextResponse<never>
  }
  return null
}
