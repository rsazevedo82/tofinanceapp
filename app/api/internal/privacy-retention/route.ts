import { NextResponse } from 'next/server'
import { log } from '@/lib/logger'
import { withRouteObservability } from '@/lib/observability'
import { runPrivacyRetentionJob } from '@/lib/privileged/retentionAdmin'

function parseDays(input: string | undefined, fallback: number): number {
  if (!input) return fallback
  const parsed = Number(input)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

export async function POST(request: Request): Promise<Response> {
  return withRouteObservability(request, {
    route: '/api/internal/privacy-retention',
    operation: 'privacy_retention_job_post',
  }, async ({ requestId }) => {
    const expectedToken = process.env.PRIVACY_RETENTION_JOB_TOKEN
    const providedToken = request.headers.get('x-retention-job-token')

    if (!expectedToken || providedToken !== expectedToken) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const auditRetentionDays = parseDays(process.env.LGPD_AUDIT_RETENTION_DAYS, 180)
    const invitationRetentionDays = parseDays(process.env.LGPD_INVITATION_RETENTION_DAYS, 30)

    const result = await runPrivacyRetentionJob({
      auditRetentionDays,
      invitationRetentionDays,
    })

    log('info', 'privacy_retention_job_success', {
      request_id: requestId,
      ...result,
      audit_retention_days: auditRetentionDays,
      invitation_retention_days: invitationRetentionDays,
    })

    return NextResponse.json(
      {
        data: {
          ...result,
          audit_retention_days: auditRetentionDays,
          invitation_retention_days: invitationRetentionDays,
        },
        error: null,
      },
      { status: 200 }
    )
  })
}
