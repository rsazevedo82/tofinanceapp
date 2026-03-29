import { NextResponse } from 'next/server'
import { log } from '@/lib/logger'
import { withRouteObservability } from '@/lib/observability'
import { runSplitReconciliationJob } from '@/lib/privileged/splitReconciliationAdmin'

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback
  return Math.floor(value)
}

export async function POST(request: Request): Promise<Response> {
  return withRouteObservability(request, {
    route: '/api/internal/splits-reconcile',
    operation: 'splits_reconcile_job_post',
  }, async ({ requestId }) => {
    const expectedToken = process.env.SPLITS_RECONCILE_JOB_TOKEN
    const providedToken = request.headers.get('x-splits-reconcile-token')

    if (!expectedToken || providedToken !== expectedToken) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as {
      lookback_days?: number
      batch_size?: number
      dry_run?: boolean
    }

    const lookbackDays = parsePositiveInt(body.lookback_days, 3650)
    const batchSize = parsePositiveInt(body.batch_size, 1000)
    const dryRun = !!body.dry_run

    const result = await runSplitReconciliationJob({
      lookbackDays,
      batchSize,
      dryRun,
    })

    log('info', 'splits_reconcile_job_success', {
      request_id: requestId,
      ...result,
    })

    return NextResponse.json(
      {
        data: result,
        error: null,
      },
      { status: 200 }
    )
  })
}
