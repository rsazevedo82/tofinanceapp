// app/api/invoices/[id]/route.ts
import { createClient }    from '@/lib/supabase/server'
import { fail, logInternalError } from '@/lib/apiResponse'
import { getRequestAuditMeta, recordAuditEvent } from '@/lib/audit'
import { payInvoiceSchema } from '@/lib/validations/schemas'
import { checkRateLimitByIP, checkRateLimitByUser }  from '@/lib/apiHelpers'
import { finalizeIdempotency, prepareIdempotency } from '@/lib/idempotency'
import type { ApiResponse, CreditInvoice } from '@/types'
import { NextResponse }    from 'next/server'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<CreditInvoice>>> {
  const params = await props.params;
  let auditUserId: string | null = null
  const limited = await checkRateLimitByIP('invoices:pay')
  if (limited) return limited

  try {
    const auditMeta = await getRequestAuditMeta()
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      await recordAuditEvent({
        action: 'finance_invoice_payment',
        status: 'failure',
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'unauthorized' },
      })
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }
    auditUserId = user.id
    const userLimited = await checkRateLimitByUser('invoices:pay', user.id)
    if (userLimited) return userLimited

    const body   = await request.json()
    const parsed = payInvoiceSchema.safeParse(body)
    if (!parsed.success) {
      await recordAuditEvent({
        action: 'finance_invoice_payment',
        status: 'failure',
        userId: user.id,
        targetType: 'invoice',
        targetId: params.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invalid_payload' },
      })
      return fail(400, 'Dados invalidos')
    }

    const preparedIdempotency = await prepareIdempotency(request, {
      userId: user.id,
      scope: `invoices:pay:${params.id}`,
      payload: parsed.data,
    })
    if (preparedIdempotency.conflictError) {
      await recordAuditEvent({
        action: 'finance_invoice_payment',
        status: 'failure',
        userId: user.id,
        targetType: 'invoice',
        targetId: params.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'idempotency_conflict' },
      })
      return fail(409, 'Idempotency-Key invalida para esta operacao.')
    }
    if (preparedIdempotency.replay) {
      return NextResponse.json(
        preparedIdempotency.replay.body as ApiResponse<CreditInvoice>,
        { status: preparedIdempotency.replay.status }
      )
    }
    if (preparedIdempotency.inProgress) {
      await recordAuditEvent({
        action: 'finance_invoice_payment',
        status: 'failure',
        userId: user.id,
        targetType: 'invoice',
        targetId: params.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'idempotency_in_progress' },
      })
      return NextResponse.json(
        { data: null, error: 'Requisicao em processamento com a mesma Idempotency-Key.' },
        { status: 409 }
      )
    }

    const respond = async (
      status: number,
      payload: ApiResponse<CreditInvoice>
    ): Promise<NextResponse<ApiResponse<CreditInvoice>>> => {
      await finalizeIdempotency(preparedIdempotency, status, payload)
      return NextResponse.json(payload, { status })
    }

    const { data: invoice, error: findError } = await supabase
      .from('credit_invoices')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (findError || !invoice) {
      await recordAuditEvent({
        action: 'finance_invoice_payment',
        status: 'failure',
        userId: user.id,
        targetType: 'invoice',
        targetId: params.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invoice_not_found' },
      })
      return respond(404, { data: null, error: 'Fatura nao encontrada' })
    }

    if (invoice.status === 'paid') {
      await recordAuditEvent({
        action: 'finance_invoice_payment',
        status: 'failure',
        userId: user.id,
        targetType: 'invoice',
        targetId: params.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invoice_already_paid' },
      })
      return respond(409, { data: null, error: 'Fatura ja foi paga' })
    }

    if (invoice.status === 'open') {
      await recordAuditEvent({
        action: 'finance_invoice_payment',
        status: 'failure',
        userId: user.id,
        targetType: 'invoice',
        targetId: params.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invoice_still_open' },
      })
      return respond(409, { data: null, error: 'Fatura ainda esta aberta - feche antes de pagar' })
    }

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

    const { data: updated, error: updateError } = await supabase
      .from('credit_invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError
    await recordAuditEvent({
      action: 'finance_invoice_payment',
      status: 'success',
      userId: user.id,
      targetType: 'invoice',
      targetId: updated.id,
      ip: auditMeta.ip,
      userAgent: auditMeta.userAgent,
      metadata: {
        amount: parsed.data.amount,
        payment_account_id: parsed.data.payment_account_id,
      },
    })
    return respond(200, { data: updated, error: null })
  } catch (err) {
    if (auditUserId) {
      const auditMeta = await getRequestAuditMeta()
      await recordAuditEvent({
        action: 'finance_invoice_payment',
        status: 'failure',
        userId: auditUserId,
        targetType: 'invoice',
        targetId: params.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'internal_error' },
      })
    }
    logInternalError('POST /api/invoices/:id', err)
    return fail(500, 'Erro interno')
  }
}
