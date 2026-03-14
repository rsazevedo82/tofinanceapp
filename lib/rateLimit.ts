const requests = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60 * 1000  // 1 minuto
const MAX_REQUESTS = 60       // 60 requisições por minuto por IP

export function rateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = requests.get(ip)

  // Janela expirada ou primeiro acesso
  if (!record || now > record.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  // Limite atingido
  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  // Incrementa contador
  record.count++
  return { allowed: true, remaining: MAX_REQUESTS - record.count }
}