// app/api/invoices/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { payInvoiceSchema } from '@/lib/validations/schemas'
import type { ApiResponse, CreditInvoice } from '@/types'
import { NextResponse } from 'next/server'

// POST /api/invoices/[id]/pay  →  pagar fatura
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<CreditInvoice>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const body   = await request.json()
    const parsed = payInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues[0]?.message ?? 'Dados invalidos' }, { status: 400 })
    }

    // Busca a fatura
    const { data: invoice, error: findError } = await supabase
      .from('credit_invoices')
      .select('*, accounts(id, name)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (findError || !invoice) {
      return NextResponse.json({ data: null, error: 'Fatura nao encontrada' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ data: null, error: 'Fatura ja foi paga' }, { status: 409 })
    }

    if (invoice.status === 'open') {
      return NextResponse.json({ data: null, error: 'Fatura ainda esta aberta - feche antes de pagar' }, { status: 409 })
    }

    // Cria transacao de pagamento na conta de origem
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id:     user.id,
        account_id:  parsed.data.payment_account_id,
        type:        'expense',
        amount:      parsed.data.amount,
        description: `Pagamento fatura ${invoice.reference_month}`,
        date:        parsed.data.payment_date,
        status:      'confirmed',
        invoice_id:  invoice.id,
      })

    if (txError) throw txError

    // Marca fatura como paga
    const { data: updated, error: updateError } = await supabase
      .from('credit_invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ data: updated, error: null })
  } catch (err) {
    console.error('[POST /api/invoices/:id/pay]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}