import { createHash } from 'crypto'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const IP_WINDOW_SECONDS = 60
const IP_MAX_ATTEMPTS = 8
const FINGERPRINT_WINDOW_SECONDS = 15 * 60
const FINGERPRINT_CAPTCHA_THRESHOLD = 3
const EMAIL_COOLDOWN_SECONDS = 90

function normalizeIp(ip: string): string {
  return ip.split(',')[0]?.trim() || '127.0.0.1'
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function hashEmailForSecurity(email: string): string {
  return hash(normalizeEmail(email))
}

function fingerprintFrom(ip: string, userAgent: string): string {
  return hash(`${normalizeIp(ip)}:${(userAgent || '').slice(0, 256)}`)
}

export type RecoveryThrottleDecision = {
  allowed: boolean
  retryAfter: number
  requireCaptcha: boolean
}

export async function checkPasswordRecoveryThrottle(params: {
  email: string
  ip: string
  userAgent: string
}): Promise<RecoveryThrottleDecision> {
  const emailHash = hashEmailForSecurity(params.email)
  const fp = fingerprintFrom(params.ip, params.userAgent)
  const ipHash = hash(normalizeIp(params.ip))

  const ipKey = `auth:pw-recovery:ip:${ipHash}`
  const fpKey = `auth:pw-recovery:fp:${fp}`
  const emailCooldownKey = `auth:pw-recovery:email-cooldown:${emailHash}`

  const ipAttempts = await redis.incr(ipKey)
  if (ipAttempts === 1) {
    await redis.expire(ipKey, IP_WINDOW_SECONDS)
  }
  if (ipAttempts > IP_MAX_ATTEMPTS) {
    const retryAfter = await redis.ttl(ipKey)
    return { allowed: false, retryAfter: Math.max(retryAfter, 1), requireCaptcha: false }
  }

  const fpAttempts = await redis.incr(fpKey)
  if (fpAttempts === 1) {
    await redis.expire(fpKey, FINGERPRINT_WINDOW_SECONDS)
  }

  const cooldownTtl = await redis.ttl(emailCooldownKey)
  if (cooldownTtl > 0) {
    return {
      allowed: false,
      retryAfter: cooldownTtl,
      requireCaptcha: false,
    }
  }

  return {
    allowed: true,
    retryAfter: 0,
    requireCaptcha: fpAttempts >= FINGERPRINT_CAPTCHA_THRESHOLD,
  }
}

export async function applyPasswordRecoveryCooldown(email: string): Promise<void> {
  const emailHash = hashEmailForSecurity(email)
  const emailCooldownKey = `auth:pw-recovery:email-cooldown:${emailHash}`
  await redis.set(emailCooldownKey, '1', { ex: EMAIL_COOLDOWN_SECONDS })
}
