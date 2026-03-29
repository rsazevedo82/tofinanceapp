import { NextResponse } from 'next/server'
import { log } from '@/lib/logger'
import { withRouteObservability } from '@/lib/observability'
import { getLatestCoupleKpiSnapshot, refreshCoupleKpiSnapshot } from '@/lib/privileged/coupleKpiAdmin'

function parsePositiveInt(input: string | null, fallback: number): number {
  if (!input) return fallback
  const parsed = Number(input)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

function isAuthorized(request: Request): boolean {
  const expectedToken = process.env.COUPLE_KPI_JOB_TOKEN
  const providedToken = request.headers.get('x-couple-kpi-token')
  return !!expectedToken && providedToken === expectedToken
}

export async function GET(request: Request): Promise<Response> {
  return withRouteObservability(request, {
    route: '/api/internal/couple-kpis',
    operation: 'couple_kpis_get',
  }, async ({ requestId }) => {
    if (!isAuthorized(request)) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const windowDays = parsePositiveInt(searchParams.get('window_days'), 30)
    const autoRefresh = searchParams.get('auto_refresh') !== 'false'

    let snapshot = await getLatestCoupleKpiSnapshot(windowDays)

    if (!snapshot && autoRefresh) {
      snapshot = await refreshCoupleKpiSnapshot({ windowDays })
    }

    log('info', 'couple_kpis_get_success', {
      request_id: requestId,
      has_snapshot: !!snapshot,
      cohort_window_days: windowDays,
    })

    return NextResponse.json(
      {
        data: snapshot,
        error: null,
      },
      { status: 200 }
    )
  })
}

export async function POST(request: Request): Promise<Response> {
  return withRouteObservability(request, {
    route: '/api/internal/couple-kpis',
    operation: 'couple_kpis_refresh_post',
  }, async ({ requestId }) => {
    if (!isAuthorized(request)) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as {
      snapshot_date?: string
      window_days?: number
    }

    const windowDays = typeof body.window_days === 'number' && body.window_days > 0
      ? Math.floor(body.window_days)
      : 30

    const snapshot = await refreshCoupleKpiSnapshot({
      snapshotDate: body.snapshot_date,
      windowDays,
    })

    log('info', 'couple_kpis_refresh_success', {
      request_id: requestId,
      snapshot_date: snapshot.snapshot_date,
      cohort_window_days: snapshot.cohort_window_days,
      users_created: snapshot.users_created,
      couples_linked: snapshot.couples_linked,
      expense_transactions: snapshot.expense_transactions,
    })

    return NextResponse.json(
      {
        data: snapshot,
        error: null,
      },
      { status: 200 }
    )
  })
}
