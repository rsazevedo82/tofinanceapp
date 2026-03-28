import { NextResponse } from 'next/server'
import { log } from '@/lib/logger'

type RouteObservabilityConfig = {
  route: string
  operation: string
  internalErrorMessage?: string
}

type RouteExecutionContext = {
  requestId: string
}

function nowMs(): number {
  return Number(process.hrtime.bigint() / BigInt(1_000_000))
}

function withCorrelationHeaders(response: Response, requestId: string, durationMs: number): Response {
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-response-time-ms', `${durationMs}`)
  return response
}

function resolveRequestId(request: Request): string {
  return request.headers.get('x-request-id') ?? crypto.randomUUID()
}

function logRequest(
  level: 'info' | 'warn' | 'error',
  config: RouteObservabilityConfig,
  request: Request,
  requestId: string,
  statusCode: number,
  durationMs: number,
  details?: Record<string, unknown>
) {
  log(level, 'http_request', {
    request_id: requestId,
    operation: config.operation,
    route: config.route,
    method: request.method,
    status_code: statusCode,
    duration_ms: durationMs,
    metric_name: 'http.server.request',
    ...details,
  })
}

export async function withRouteObservability(
  request: Request,
  config: RouteObservabilityConfig,
  handler: (ctx: RouteExecutionContext) => Promise<Response>
): Promise<Response> {
  const startedAt = nowMs()
  const requestId = resolveRequestId(request)

  try {
    const response = await handler({ requestId })
    const durationMs = Math.max(0, nowMs() - startedAt)
    const statusCode = response.status
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    logRequest(level, config, request, requestId, statusCode, durationMs)
    return withCorrelationHeaders(response, requestId, durationMs)
  } catch (error) {
    const durationMs = Math.max(0, nowMs() - startedAt)
    logRequest('error', config, request, requestId, 500, durationMs, {
      error,
      alert_candidate: true,
    })

    const internalError = NextResponse.json(
      { data: null, error: config.internalErrorMessage ?? 'Erro interno' },
      { status: 500 }
    )
    return withCorrelationHeaders(internalError, requestId, durationMs)
  }
}
