import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type QueryKey,
} from '@tanstack/react-query'
import type { Transaction, ApiResponse } from '@/types'
import { generateIdempotencyKey } from '@/lib/idempotencyKey'

type TransactionQueryParams = {
  start?: string
  end?: string
  account_id?: string
  user_id?: string
}

type TransactionSnapshot = {
  queryKey: QueryKey
  data: Transaction[]
}

function getTransactionMonth(tx?: Transaction | null): string | null {
  return tx?.date ? tx.date.slice(0, 7) : null
}

function isCurrentMonth(month: string | null): boolean {
  if (!month) return false
  return month === new Date().toISOString().slice(0, 7)
}

function parseTransactionParamsFromKey(queryKey: QueryKey): TransactionQueryParams | null {
  const [, maybeParams] = queryKey as [unknown, unknown]
  if (!maybeParams || typeof maybeParams !== 'object' || Array.isArray(maybeParams)) return null
  return maybeParams as TransactionQueryParams
}

function matchesTransactionQuery(tx: Transaction, queryKey: QueryKey): boolean {
  const key = queryKey as unknown[]
  if (key[0] !== 'transactions') return false

  if (key[1] === 'invoice') {
    const invoiceId = typeof key[2] === 'string' ? key[2] : ''
    return !!invoiceId && tx.invoice_id === invoiceId
  }

  const params = parseTransactionParamsFromKey(queryKey)
  if (!params) return true

  if (params.account_id && tx.account_id !== params.account_id) return false
  if (params.user_id && tx.user_id !== params.user_id) return false
  if (params.start && tx.date < params.start) return false
  if (params.end && tx.date > params.end) return false

  return true
}

function sortTransactions(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return b.created_at.localeCompare(a.created_at)
  })
}

function snapshotTransactionQueries(queryClient: ReturnType<typeof useQueryClient>): TransactionSnapshot[] {
  return queryClient
    .getQueryCache()
    .findAll({ queryKey: ['transactions'] })
    .map(query => {
      const current = queryClient.getQueryData<Transaction[]>(query.queryKey)
      return Array.isArray(current) ? { queryKey: query.queryKey, data: current } : null
    })
    .filter((s): s is TransactionSnapshot => s !== null)
}

function restoreTransactionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: TransactionSnapshot[] | undefined
) {
  for (const snapshot of snapshots ?? []) {
    queryClient.setQueryData(snapshot.queryKey, snapshot.data)
  }
}

function findTransactionInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string
): Transaction | null {
  const queries = queryClient.getQueryCache().findAll({ queryKey: ['transactions'] })
  for (const query of queries) {
    const rows = queryClient.getQueryData<Transaction[]>(query.queryKey)
    if (!Array.isArray(rows)) continue
    const found = rows.find(tx => tx.id === id)
    if (found) return found
  }
  return null
}

function upsertTransactionInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  tx: Transaction
) {
  const queries = queryClient.getQueryCache().findAll({ queryKey: ['transactions'] })
  for (const query of queries) {
    queryClient.setQueryData<Transaction[]>(query.queryKey, old => {
      const current = Array.isArray(old) ? old : []
      const index = current.findIndex(item => item.id === tx.id)
      const shouldBelong = matchesTransactionQuery(tx, query.queryKey)

      if (index >= 0 && !shouldBelong) {
        return current.filter(item => item.id !== tx.id)
      }

      if (index >= 0 && shouldBelong) {
        const next = [...current]
        next[index] = tx
        return sortTransactions(next)
      }

      if (index < 0 && shouldBelong) {
        return sortTransactions([tx, ...current])
      }

      return current
    })
  }
}

function removeTransactionFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string
) {
  const queries = queryClient.getQueryCache().findAll({ queryKey: ['transactions'] })
  for (const query of queries) {
    queryClient.setQueryData<Transaction[]>(query.queryKey, old => {
      if (!Array.isArray(old)) return old
      if (!old.some(item => item.id === id)) return old
      return old.filter(item => item.id !== id)
    })
  }
}

function invalidateFinancialSummaries(
  queryClient: ReturnType<typeof useQueryClient>,
  currentTx: Transaction | null,
  previousTx: Transaction | null
) {
  const affectedMonths = new Set<string>()
  const currentMonth = getTransactionMonth(currentTx)
  const previousMonth = getTransactionMonth(previousTx)
  if (currentMonth) affectedMonths.add(currentMonth)
  if (previousMonth) affectedMonths.add(previousMonth)

  for (const month of affectedMonths) {
    queryClient.invalidateQueries({ queryKey: ['reports', month], exact: true })
  }

  if ([...affectedMonths].some(month => isCurrentMonth(month))) {
    queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: true })
  }

  const affectedUsers = new Set<string>()
  if (currentTx?.user_id) affectedUsers.add(currentTx.user_id)
  if (previousTx?.user_id) affectedUsers.add(previousTx.user_id)

  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey as unknown[]
      if (key[0] !== 'accounts') return false
      const scope = String(key[1] ?? 'me')
      return scope === 'me' || affectedUsers.has(scope)
    },
  })
}

export function useTransactions(params?: {
  start?:      string
  end?:        string
  account_id?: string
  user_id?:    string   // visão do parceiro
  limit?:      number
  offset?:     number
}) {
  const limit = params?.limit ?? 200
  const offset = params?.offset ?? 0

  const searchParams = new URLSearchParams()
  if (params?.start)      searchParams.set('start',      params.start)
  if (params?.end)        searchParams.set('end',        params.end)
  if (params?.account_id) searchParams.set('account_id', params.account_id)
  if (params?.user_id)    searchParams.set('user_id',    params.user_id)
  searchParams.set('limit', String(limit))
  searchParams.set('offset', String(offset))

  const query = searchParams.toString()

  return useQuery({
    queryKey: ['transactions', params],
    queryFn: async (): Promise<Transaction[]> => {
      const res = await fetch(`/api/transactions${query ? `?${query}` : ''}`)
      const json: ApiResponse<Transaction[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })
}

export function useInfiniteTransactions(params?: {
  start?: string
  end?: string
  account_id?: string
  user_id?: string
  pageSize?: number
}) {
  const pageSize = params?.pageSize ?? 60

  return useInfiniteQuery({
    queryKey: ['transactions-infinite', { ...params, pageSize }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Transaction[]> => {
      const searchParams = new URLSearchParams()
      if (params?.start)      searchParams.set('start',      params.start)
      if (params?.end)        searchParams.set('end',        params.end)
      if (params?.account_id) searchParams.set('account_id', params.account_id)
      if (params?.user_id)    searchParams.set('user_id',    params.user_id)
      searchParams.set('limit', String(pageSize))
      searchParams.set('offset', String(pageParam))

      const res = await fetch(`/api/transactions/summary?${searchParams.toString()}`)
      const json: ApiResponse<Transaction[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const idempotencyKey = generateIdempotencyKey('tx-create')
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      })
      const json: ApiResponse<Transaction> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: (created) => {
      if (!created) return
      upsertTransactionInCache(queryClient, created)
      queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] })
      invalidateFinancialSummaries(queryClient, created, null)
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json: ApiResponse<Transaction> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] })

      const snapshots = snapshotTransactionQueries(queryClient)
      const previousTx = findTransactionInCache(queryClient, id)

      if (previousTx) {
        const optimistic = { ...previousTx, ...body } as Transaction
        upsertTransactionInCache(queryClient, optimistic)
      }

      return { snapshots, previousTx }
    },
    onError: (_error, _variables, context) => {
      restoreTransactionQueries(queryClient, context?.snapshots)
    },
    onSuccess: (updated, _variables, context) => {
      if (!updated) return
      upsertTransactionInCache(queryClient, updated)
      queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] })
      invalidateFinancialSummaries(queryClient, updated, context?.previousTx ?? null)
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      const json: ApiResponse<null> = await res.json()
      if (json.error) throw new Error(json.error)
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] })

      const snapshots = snapshotTransactionQueries(queryClient)
      const previousTx = findTransactionInCache(queryClient, id)
      removeTransactionFromCache(queryClient, id)

      return { snapshots, previousTx }
    },
    onError: (_error, _id, context) => {
      restoreTransactionQueries(queryClient, context?.snapshots)
    },
    onSuccess: (_data, _id, context) => {
      queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] })
      invalidateFinancialSummaries(queryClient, null, context?.previousTx ?? null)
    },
  })
}
