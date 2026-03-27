const SENSITIVE_KEY_PATTERN =
  /(password|pass|token|secret|authorization|cookie|api[_-]?key|private[_-]?key|refresh[_-]?token|access[_-]?token)/i

const SENSITIVE_VALUE_PATTERNS = [
  /bearer\s+[a-z0-9\-._~+/]+=*/i,
  /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/, // JWT
]

const REDACTED = '[REDACTED]'
const MAX_DEPTH = 5

function sanitizeString(value: string): string {
  let result = value
  for (const pattern of SENSITIVE_VALUE_PATTERNS) {
    result = result.replace(pattern, REDACTED)
  }
  return result
}

function sanitizeError(err: Error): Record<string, unknown> {
  return {
    name: err.name,
    message: sanitizeString(err.message),
    stack: err.stack ? sanitizeString(err.stack) : undefined,
  }
}

export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[MAX_DEPTH]'

  if (value == null) return value
  if (typeof value === 'string') return sanitizeString(value)
  if (typeof value === 'number' || typeof value === 'boolean') return value

  if (value instanceof Error) {
    return sanitizeError(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item, depth + 1))
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        out[key] = REDACTED
      } else {
        out[key] = sanitizeForLog(nestedValue, depth + 1)
      }
    }
    return out
  }

  return String(value)
}
