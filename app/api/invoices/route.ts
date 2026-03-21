// app/api/invoices/route.ts
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, CreditInvoice } from '@/types'
import { NextResponse } from 'next/server'
import { shouldAutoClose } from '@/lib/domain/invoices'

// GET /api/invoices?account_id=xxx
export async function GET(request: Request): Promise<NextResponse<ApiResponse<CreditInvoice[]>>> {
  try {
    const supabase  = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id')

    if (!accountId) {
      return NextResponse.json({ data: null, error: 'account_id e obrigatorio' }, { status: 400 })
    }

    // Busca a conta para obter closing_day
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, closing_day, due_day, type')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ data: null, error: 'Conta nao encontrada' }, { status: 404 })
    }

    if (account.type !== 'credit') {
      return NextResponse.json({ data: null, error: 'Conta nao e um cartao de credito' }, { status: 400 })
    }

    // Busca faturas
    const { data: invoices, error } = await supabase
      .from('credit_invoices')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .order('reference_month', { ascending: false })

    if (error) throw error

    // Fechamento automatico: fecha faturas que passaram do dia de fechamento
    if (account.closing_day && invoices) {
      const toClose = invoices.filter(inv => shouldAutoClose(inv, account.closing_day!))

      for (const invoice of toClose) {
        await supabase
          .from('credit_invoices')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .eq('id', invoice.id)

        invoice.status    = 'closed'
        invoice.closed_at = new Date().toISOString()
      }
    }

    return NextResponse.json({ data: invoices, error: null })
  } catch (err) {
    console.error('[GET /api/invoices]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}