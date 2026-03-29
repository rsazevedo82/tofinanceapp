import { adminClient } from '@/lib/supabase/admin'

export type CoupleKpiSnapshot = {
  snapshot_date: string
  cohort_window_days: number
  users_created: number
  users_linked_d7: number
  users_linked_d7_pct: number
  couples_linked: number
  couples_with_first_split_d7: number
  couples_first_split_d7_pct: number
  expense_transactions: number
  expense_transactions_split_linked: number
  expense_transactions_split_linked_pct: number
  generated_at: string
}

function normalizeSnapshotRow(row: unknown): CoupleKpiSnapshot {
  const item = (row ?? {}) as Record<string, unknown>
  return {
    snapshot_date: String(item.snapshot_date ?? ''),
    cohort_window_days: Number(item.cohort_window_days ?? 30),
    users_created: Number(item.users_created ?? 0),
    users_linked_d7: Number(item.users_linked_d7 ?? 0),
    users_linked_d7_pct: Number(item.users_linked_d7_pct ?? 0),
    couples_linked: Number(item.couples_linked ?? 0),
    couples_with_first_split_d7: Number(item.couples_with_first_split_d7 ?? 0),
    couples_first_split_d7_pct: Number(item.couples_first_split_d7_pct ?? 0),
    expense_transactions: Number(item.expense_transactions ?? 0),
    expense_transactions_split_linked: Number(item.expense_transactions_split_linked ?? 0),
    expense_transactions_split_linked_pct: Number(item.expense_transactions_split_linked_pct ?? 0),
    generated_at: String(item.generated_at ?? ''),
  }
}

export async function refreshCoupleKpiSnapshot(params?: {
  snapshotDate?: string
  windowDays?: number
}): Promise<CoupleKpiSnapshot> {
  const rpcPayload: Record<string, unknown> = {}
  if (params?.snapshotDate) rpcPayload.p_snapshot_date = params.snapshotDate
  if (params?.windowDays) rpcPayload.p_window_days = params.windowDays

  const { data, error } = await adminClient.rpc('refresh_couple_kpis_snapshot', rpcPayload)
  if (error) throw error

  const row = Array.isArray(data) ? data[0] : data
  return normalizeSnapshotRow(row)
}

export async function getLatestCoupleKpiSnapshot(windowDays = 30): Promise<CoupleKpiSnapshot | null> {
  const { data, error } = await adminClient
    .from('couple_kpi_snapshots')
    .select('*')
    .eq('cohort_window_days', windowDays)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return normalizeSnapshotRow(data)
}
