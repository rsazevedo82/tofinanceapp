import { createHash } from 'crypto'
import { Redis } from '@upstash/redis'
import { insertAdminNotification } from '@/lib/privileged/notificationsAdmin'

type SecurityNotificationType =
  | 'security_new_device'
  | 'security_password_changed'
  | 'security_email_change_requested'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const DEVICE_SEEN_TTL_SECONDS = 90 * 24 * 60 * 60

function normalizeIp(ip: string): string {
  return ip.split(',')[0]?.trim() || '127.0.0.1'
}

function fingerprintDevice(userId: string, ip: string, userAgent: string): string {
  const raw = `${userId}:${normalizeIp(ip)}:${userAgent.trim().toLowerCase()}`
  return createHash('sha256').update(raw).digest('hex')
}

export function tryGetUserIdFromAccessToken(accessToken: string): string | null {
  try {
    const parts = accessToken.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { sub?: string }
    return payload.sub ?? null
  } catch {
    return null
  }
}

export async function notifySecurityEvent(
  userId: string,
  type: SecurityNotificationType,
  title: string,
  body: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  await insertAdminNotification({
    user_id: userId,
    type,
    title,
    body,
    payload,
    created_at: new Date().toISOString(),
  })
}

export async function notifyNewDeviceIfNeeded(params: {
  userId: string
  ip: string
  userAgent: string
  city?: string | null
  country?: string | null
}): Promise<void> {
  const fingerprint = fingerprintDevice(params.userId, params.ip, params.userAgent)
  const key = `security:device-seen:${params.userId}:${fingerprint}`
  const isFirstSeen = await redis.set(key, '1', { nx: true, ex: DEVICE_SEEN_TTL_SECONDS })
  if (!isFirstSeen) return

  const location =
    [params.city, params.country].filter(Boolean).join(', ') || 'local desconhecido'
  const uaPreview = params.userAgent?.slice(0, 80) || 'navegador desconhecido'

  await notifySecurityEvent(
    params.userId,
    'security_new_device',
    'Novo acesso detectado',
    `Detectamos um novo acesso a partir de ${location}.`,
    {
      ip: normalizeIp(params.ip),
      user_agent: uaPreview,
      location,
    }
  )
}
