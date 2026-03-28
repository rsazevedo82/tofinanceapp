import { createClient } from '@/lib/supabase/server'
import { checkRateLimitByIP, checkRateLimitByUser } from '@/lib/apiHelpers'
import type { Account, ApiResponse, CardOverviewItem, CreditInvoice } from '@/types'
import { NextResponse } from 'next/server'

type InvoiceStatus = CreditInvoice['status']

export async function GET(): Promise<NextResponse<ApiResponse<CardOverviewItem[]>>> {
  const limited = await checkRateLimitByIP('cards:overview')
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const userLimited = await checkRateLimitByUser('cards:overview', user.id)
    if (userLimited) return userLimited

    const { data: cards, error: cardsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'credit')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (cardsError) throw cardsError

    const creditCards = (cards ?? []) as Account[]
    if (creditCards.length === 0) {
      return NextResponse.json({ data: [], error: null })
    }

    const cardIds = creditCards.map(card => card.id)

    const { data: invoices, error: invoicesError } = await supabase
      .from('credit_invoices')
      .select('*')
      .eq('user_id', user.id)
      .in('account_id', cardIds)
      .in('status', ['open', 'closed'] satisfies InvoiceStatus[])
      .order('reference_month', { ascending: false })

    if (invoicesError) throw invoicesError

    const byCard = new Map<string, CardOverviewItem['summary']>()

    for (const invoice of (invoices ?? []) as CreditInvoice[]) {
      const acc = byCard.get(invoice.account_id) ?? {
        open_invoice: null,
        closed_invoice: null,
        used_amount: 0,
      }

      acc.used_amount += Number(invoice.total_amount)

      if (invoice.status === 'open' && !acc.open_invoice) {
        acc.open_invoice = invoice
      }
      if (invoice.status === 'closed' && !acc.closed_invoice) {
        acc.closed_invoice = invoice
      }

      byCard.set(invoice.account_id, acc)
    }

    const data: CardOverviewItem[] = creditCards.map(card => ({
      card,
      summary: byCard.get(card.id) ?? {
        open_invoice: null,
        closed_invoice: null,
        used_amount: 0,
      },
    }))

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[GET /api/cards/overview]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
