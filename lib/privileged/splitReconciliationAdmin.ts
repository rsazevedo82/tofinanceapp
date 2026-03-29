import { adminClient } from '@/lib/supabase/admin'

type ReconcileParams = {
  lookbackDays?: number
  batchSize?: number
  dryRun?: boolean
}

export type SplitReconcileResult = {
  scanned_transactions: number
  scanned_linked_splits: number
  created_splits: number
  updated_splits: number
  stale_splits_deleted: number
  skipped_without_couple: number
  lookback_days: number
  dry_run: boolean
}

type TransactionRow = {
  id: string
  user_id: string
  type: 'income' | 'expense' | 'transfer'
  description: string
  date: string
  amount: number
  deleted_at: string | null
}

type SplitRow = {
  id: string
  transaction_id: string | null
}

function toIsoDateDaysAgo(days: number): string {
  const ms = Date.now() - days * 24 * 60 * 60 * 1000
  return new Date(ms).toISOString().split('T')[0]
}

function chunk<T>(items: T[], size: number): T[][]
{
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export async function runSplitReconciliationJob(params?: ReconcileParams): Promise<SplitReconcileResult> {
  const lookbackDays = Math.max(1, Math.floor(params?.lookbackDays ?? 3650))
  const batchSize = Math.min(5000, Math.max(50, Math.floor(params?.batchSize ?? 1000)))
  const dryRun = !!params?.dryRun
  const cutoffDate = toIsoDateDaysAgo(lookbackDays)

  const { data: couples, error: couplesError } = await adminClient
    .from('couple_profiles')
    .select('id, user_id_1, user_id_2')

  if (couplesError) throw couplesError

  const coupleByUser = new Map<string, string>()
  for (const c of couples ?? []) {
    if (!coupleByUser.has(c.user_id_1)) coupleByUser.set(c.user_id_1, c.id)
    if (!coupleByUser.has(c.user_id_2)) coupleByUser.set(c.user_id_2, c.id)
  }

  const { data: transactions, error: txError } = await adminClient
    .from('transactions')
    .select('id, user_id, type, description, date, amount, deleted_at')
    .gte('date', cutoffDate)
    .order('date', { ascending: false })
    .limit(batchSize)

  if (txError) throw txError

  const expenseTransactions = (transactions ?? []).filter((tx) => tx.type === 'expense' && !tx.deleted_at) as TransactionRow[]
  const txIds = expenseTransactions.map((t) => t.id)

  const existingByTransaction = new Map<string, string>()
  if (txIds.length > 0) {
    const { data: existingSplits, error: existingError } = await adminClient
      .from('expense_splits')
      .select('id, transaction_id')
      .in('transaction_id', txIds)

    if (existingError) throw existingError
    for (const row of existingSplits ?? []) {
      if (row.transaction_id) existingByTransaction.set(row.transaction_id, row.id)
    }
  }

  let skippedWithoutCouple = 0
  const upserts: Array<Record<string, unknown>> = []

  for (const tx of expenseTransactions) {
    const coupleId = coupleByUser.get(tx.user_id)
    if (!coupleId) {
      skippedWithoutCouple++
      continue
    }

    const totalAmount = round2(tx.amount)
    const partnerAmount = round2(totalAmount / 2)
    const payerAmount = round2(totalAmount - partnerAmount)

    upserts.push({
      transaction_id: tx.id,
      couple_id: coupleId,
      payer_id: tx.user_id,
      description: tx.description,
      date: tx.date,
      total_amount: totalAmount,
      split_mode: 'equal',
      payer_share_percent: 50,
      payer_amount: payerAmount,
      partner_amount: partnerAmount,
      status: 'pending',
    })
  }

  const createdSplits = upserts.filter((row) => !existingByTransaction.has(String(row.transaction_id))).length
  const updatedSplits = upserts.length - createdSplits

  if (!dryRun && upserts.length > 0) {
    for (const rows of chunk(upserts, 200)) {
      const { error: upsertError } = await adminClient
        .from('expense_splits')
        .upsert(rows, { onConflict: 'transaction_id' })
      if (upsertError) throw upsertError
    }
  }

  const { data: linkedSplits, error: linkedError } = await adminClient
    .from('expense_splits')
    .select('id, transaction_id')
    .not('transaction_id', 'is', null)
    .gte('date', cutoffDate)
    .limit(batchSize)

  if (linkedError) throw linkedError

  const splitRows = (linkedSplits ?? []) as SplitRow[]
  const linkedIds = splitRows.map((s) => s.transaction_id).filter(Boolean) as string[]

  const txById = new Map<string, TransactionRow>()
  if (linkedIds.length > 0) {
    const { data: linkedTxRows, error: linkedTxError } = await adminClient
      .from('transactions')
      .select('id, user_id, type, description, date, amount, deleted_at')
      .in('id', linkedIds)

    if (linkedTxError) throw linkedTxError
    for (const tx of linkedTxRows ?? []) {
      txById.set(tx.id, tx as TransactionRow)
    }
  }

  const staleSplitIds: string[] = []
  for (const split of splitRows) {
    if (!split.transaction_id) continue
    const tx = txById.get(split.transaction_id)
    const coupleId = tx ? coupleByUser.get(tx.user_id) : null
    const shouldExist = !!tx && !tx.deleted_at && tx.type === 'expense' && !!coupleId
    if (!shouldExist) staleSplitIds.push(split.id)
  }

  if (!dryRun && staleSplitIds.length > 0) {
    for (const ids of chunk(staleSplitIds, 200)) {
      const { error: deleteError } = await adminClient
        .from('expense_splits')
        .delete()
        .in('id', ids)
      if (deleteError) throw deleteError
    }
  }

  return {
    scanned_transactions: expenseTransactions.length,
    scanned_linked_splits: splitRows.length,
    created_splits: createdSplits,
    updated_splits: updatedSplits,
    stale_splits_deleted: staleSplitIds.length,
    skipped_without_couple: skippedWithoutCouple,
    lookback_days: lookbackDays,
    dry_run: dryRun,
  }
}
