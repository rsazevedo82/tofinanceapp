import { Redis } from '@upstash/redis'
import { createHash } from 'crypto'

type AuthAction = 'login' | 'signup'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ATTEMPT_WINDOW_SECONDS = 15 * 60
const MAX_ATTEMPTS_BEFORE_LOCK = 5
const BASE_LOCK_SECONDS = 30
const MAX_LOCK_SECONDS = 15 * 60
const LOCK_LEVEL_TTL_SECONDS = 24 * 60 * 60

function normalizeIp(ip: string): string {
  return ip.split(',')[0]?.trim() || '127.0.0.1'
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function fingerprint(action: AuthAction, email: string, ip: string): string {
  const raw = `${action}:${normalizeEmail(email)}:${normalizeIp(ip)}`
  return createHash('sha256').update(raw).digest('hex')
}

function keys(action: AuthAction, email: string, ip: string) {
  const id = fingerprint(action, email, ip)
  return {
    attempts: `auth:attempts:${id}`,
    lock: `auth:lock:${id}`,
    level: `auth:lock-level:${id}`,
  }
}

export async function getAuthLock(
  action: AuthAction,
  email: string,
  ip: string
): Promise<{ blocked: boolean; retryAfter: number }> {
  const k = keys(action, email, ip)
  const ttl = await redis.ttl(k.lock)
  if (ttl > 0) {
    return { blocked: true, retryAfter: ttl }
  }
  return { blocked: false, retryAfter: 0 }
}

export async function registerAuthFailure(
  action: AuthAction,
  email: string,
  ip: string
): Promise<{ blocked: boolean; retryAfter: number; attemptsLeft: number }> {
  const k = keys(action, email, ip)

  const attempts = await redis.incr(k.attempts)
  if (attempts === 1) {
    await redis.expire(k.attempts, ATTEMPT_WINDOW_SECONDS)
  }

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS_BEFORE_LOCK - attempts)
  if (attempts < MAX_ATTEMPTS_BEFORE_LOCK) {
    return { blocked: false, retryAfter: 0, attemptsLeft }
  }

  await redis.del(k.attempts)

  const level = await redis.incr(k.level)
  if (level === 1) {
    await redis.expire(k.level, LOCK_LEVEL_TTL_SECONDS)
  }

  const retryAfter = Math.min(BASE_LOCK_SECONDS * 2 ** (level - 1), MAX_LOCK_SECONDS)
  await redis.set(k.lock, '1', { ex: retryAfter })

  return { blocked: true, retryAfter, attemptsLeft: 0 }
}

export async function clearAuthFailures(action: AuthAction, email: string, ip: string): Promise<void> {
  const k = keys(action, email, ip)
  await redis.del(k.attempts, k.lock, k.level)
}
