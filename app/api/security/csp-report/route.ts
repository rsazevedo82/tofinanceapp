import { NextResponse } from 'next/server'
import { log } from '@/lib/logger'

type CspReportEnvelope = {
  'csp-report'?: Record<string, unknown>
}

export async function POST(request: Request): Promise<Response> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  try {
    const contentType = request.headers.get('content-type') ?? 'unknown'
    const body = (await request.json()) as CspReportEnvelope | unknown[]

    // CSP reports podem chegar no formato legado {"csp-report": {...}}
    // ou via Reporting API (array de objetos).
    const reportPayload = Array.isArray(body)
      ? body.slice(0, 10)
      : body && typeof body === 'object' && 'csp-report' in body
        ? (body as CspReportEnvelope)['csp-report']
        : body

    log('warn', 'security_csp_violation_report', {
      request_id: requestId,
      contentType,
      report: reportPayload,
    })
  } catch (error) {
    log('error', 'security_csp_violation_report_parse_failed', {
      request_id: requestId,
      error,
    })
  }

  // 204 evita ruído no browser e confirma recebimento.
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('x-request-id', requestId)
  return response
}
