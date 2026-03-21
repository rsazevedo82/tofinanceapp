// hooks/useInvoices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreditInvoice, ApiResponse } from '@/types'

export function useInvoices(accountId: string | null) {
  return useQuery({
    queryKey: ['invoices', accountId],
    enabled:  !!accountId,
    queryFn:  async (): Promise<CreditInvoice[]> => {
      const res  = await fetch(`/api/invoices?account_id=${accountId}`)
      const json: ApiResponse<CreditInvoice[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })
}

export function usePayInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      invoiceId,
      body,
    }: {
      invoiceId: string
      body: Record<string, unknown>
    }) => {
      const res  = await fetch(`/api/invoices/${invoiceId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json: ApiResponse<CreditInvoice> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}