import { sanitizeForLog } from '@/lib/logSanitizer'

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  action: string
  service: string
  environment: string
  userId?: string
  requestId?: string
  details?: Record<string, unknown>
  timestamp: string
}

export function log(level: LogLevel, action: string, details?: {
  userId?: string
  requestId?: string
  request_id?: string
  [key: string]: unknown
}) {
  const requestId = typeof details?.requestId === 'string'
    ? details.requestId
    : typeof details?.request_id === 'string'
      ? details.request_id
      : undefined

  const entry: LogEntry = {
    level,
    action,
    service: process.env.OBS_SERVICE_NAME ?? 'tofinanceapp',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    userId: details?.userId,
    requestId,
    details: sanitizeForLog(details) as Record<string, unknown> | undefined,
    timestamp: new Date().toISOString(),
  }

  // Em produção isso vai para os logs da Vercel
  // Futuramente pode ser direcionado para Datadog, Sentry, etc.
  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}
