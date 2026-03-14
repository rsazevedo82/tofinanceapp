type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level:     LogLevel
  action:    string
  userId?:   string
  details?:  Record<string, unknown>
  timestamp: string
}

export function log(level: LogLevel, action: string, details?: {
  userId?: string
  [key: string]: unknown
}) {
  const entry: LogEntry = {
    level,
    action,
    userId:    details?.userId,
    details,
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