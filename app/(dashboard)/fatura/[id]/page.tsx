// app/(dashboard)/fatura/[id]/page.tsx
'use client'

import { useParams, useRouter }       from 'next/navigation'
import { useState }                   from 'react'
import { useInvoices, usePayInvoice } from '@/hooks/useInvoices'
import { useAccounts }                from '@/hooks/useAccounts'
import { useQuery }                   from '@tanstack/react-query'
import { formatCurrency }             from '@/lib/utils/format'
import { Modal }                      from '@/components/ui/Modal'
import { TransactionForm }            from '@/components/finance/TransactionForm'
import { useCouple }                  from '@/hooks/useCouple'
import { c }                          from '@/lib/utils/copy'
import type { Transaction, ApiResponse } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  open:   'Aberta',
  closed: 'Fechada',
  paid:   'Paga',
}

const STATUS_COLOR: Record<string, string> = {
  open:   '#F59E0B',
  closed: '#FF7F50',
  paid:   '#2DD4BF',
}

export default function FaturaPage() {
  const { id: accountId } = useParams<{ id: string }>()
  const router            = useRouter()

  const { data: couple }                         = useCouple()
  const isCouple                                 = !!couple
  const { data: accounts = [] }                  = useAccounts()
  const { data: invoices = [], isLoading }        = useInvoices(accountId)
  const payInvoice                                = usePayInvoice()

  const account = accounts.find(a => a.id === accountId)

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [paymentAccountId,  setPaymentAccountId]  = useState('')
  const [paymentDate,       setPaymentDate]        = useState(
    new Date().toISOString().split('T')[0]
  )
  const [showNewTx, setShowNewTx] = useState(false)
  const [error,     setError]     = useState('')

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId) ?? invoices[0] ?? null

  // Transacoes da fatura selecionada
  const { data: transactions = [], refetch: refetchTx } = useQuery({
    queryKey: ['transactions', 'invoice', selectedInvoice?.id],
    enabled:  !!selectedInvoice?.id,
    queryFn:  async (): Promise<Transaction[]> => {
      const res  = await fetch(`/api/transactions?invoice_id=${selectedInvoice!.id}&limit=200`)
      const json: ApiResponse<Transaction[]> = await res.json()
      if (json.error) throw new Error(json.error)
      return json.data ?? []
    },
  })

  const payableAccounts = accounts.filter(a => a.type !== 'credit' && a.is_active)

  // Total calculado a partir das transacoes (fonte da verdade)
  const calculatedTotal = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

  async function handlePay() {
    if (!selectedInvoice || !paymentAccountId) return
    setError('')
    payInvoice.mutate(
      {
        invoiceId: selectedInvoice.id,
        body: {
          payment_account_id: paymentAccountId,
          amount:             calculatedTotal,
          payment_date:       paymentDate,
        },
      },
      {
        onSuccess: () => setSelectedInvoiceId(null),
        onError:   (err) => setError(err.message),
      }
    )
  }

  if (!account) return null

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 md:py-12">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-xs px-2 py-1 rounded-lg transition-colors text-[#6B7280] bg-[#F3F4F6] hover:bg-[#E5E7EB]"
          >
            ← voltar
          </button>
          <div>
            <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
              {account.name}
            </h1>
            <p className="text-sm mt-0.5 text-[#6B7280]">
              Fecha dia {account.closing_day} · Vence dia {account.due_day}
            </p>
          </div>
        </div>

        {/* Botao Nova Transacao */}
        <button onClick={() => setShowNewTx(true)} className="btn-primary">
          <span className="text-lg leading-none">+</span>
          Nova transação
        </button>
      </div>

      {/* Limite */}
      {account.credit_limit && (
        <div className="card mb-6 grid grid-cols-3 gap-4">
          <div>
            <p className="label">Limite total</p>
            <p className="text-lg font-black text-[#0F172A]">
              {formatCurrency(account.credit_limit)}
            </p>
          </div>
          <div>
            <p className="label">Fatura aberta</p>
            <p className="text-lg font-black" style={{ color: '#F59E0B' }}>
              {formatCurrency(invoices.find(i => i.status === 'open')?.total_amount ?? 0)}
            </p>
          </div>
          <div>
            <p className="label">Disponível</p>
            <p className="text-lg font-black" style={{ color: '#2DD4BF' }}>
              {formatCurrency(
                account.credit_limit -
                invoices
                  .filter(i => i.status !== 'paid')
                  .reduce((s, i) => s + Number(i.total_amount), 0)
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Lista de faturas */}
        <div>
          <p className="section-heading">Faturas</p>
          {isLoading ? (
            <div className="space-y-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="db-row px-2 py-3 animate-pulse">
                  <div className="h-3 bg-[#E5E7EB] rounded w-full" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-xs py-8 text-center text-[#6B7280]">
              {c(isCouple, 'Nenhuma fatura ainda. Registre um gasto para começar.', 'Nenhuma fatura ainda. Registrem um gasto para começar.')}
            </p>
          ) : (
            <div className="space-y-0.5">
              {invoices.map(invoice => {
                const isSelected = (selectedInvoice?.id ?? invoices[0]?.id) === invoice.id
                return (
                  <div
                    key={invoice.id}
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                    className={`db-row flex items-center justify-between px-2 py-3 ${
                      isSelected ? 'bg-[#FFF5F0]' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm text-[#0F172A]">{invoice.reference_month}</p>
                      <p className="text-[10px] font-semibold" style={{ color: STATUS_COLOR[invoice.status] }}>
                        {STATUS_LABEL[invoice.status]}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[#0F172A]">
                      {formatCurrency(Number(invoice.total_amount))}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Detalhe da fatura */}
        <div className="md:col-span-2">
          {selectedInvoice ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="section-heading mb-0">
                  Lançamentos · {selectedInvoice.reference_month}
                </p>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    color:      STATUS_COLOR[selectedInvoice.status],
                    background: `${STATUS_COLOR[selectedInvoice.status]}18`,
                  }}
                >
                  {STATUS_LABEL[selectedInvoice.status]}
                </span>
              </div>

              {/* Lista de transacoes */}
              <div className="space-y-0.5 mb-4">
                {transactions.length === 0 ? (
                  <p className="text-xs py-6 text-center text-[#6B7280]">
                    Nenhum lançamento nesta fatura
                  </p>
                ) : (
                  transactions.map(tx => (
                    <div key={tx.id} className="db-row flex items-center justify-between px-2 py-2.5">
                      <div>
                        <p className="text-sm text-[#0F172A]">{tx.description}</p>
                        <p className="text-[10px] text-[#6B7280]">
                          {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          {tx.installment_number ? ` · Parcela ${tx.installment_number}` : ''}
                        </p>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: '#FF7F50' }}>
                        -{formatCurrency(Number(tx.amount))}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Total calculado pelas transacoes */}
              <div
                className="flex items-center justify-between px-2 py-2.5 rounded-lg mb-4 bg-[#F3F4F6]"
                style={{ border: '1px solid #D1D5DB' }}
              >
                <p className="text-sm font-semibold text-[#0F172A]">Total da fatura</p>
                <p className="text-sm font-black text-[#0F172A]">
                  {formatCurrency(calculatedTotal)}
                </p>
              </div>

              {/* Pagar fatura */}
              {selectedInvoice.status === 'closed' && (
                <div
                  className="p-4 rounded-xl space-y-3 bg-white"
                  style={{ border: '1px solid #D1D5DB' }}
                >
                  <p className="text-sm font-semibold text-[#0F172A]">Pagar fatura</p>

                  <div>
                    <label className="label">Pagar com</label>
                    <select
                      className="input"
                      value={paymentAccountId}
                      onChange={e => setPaymentAccountId(e.target.value)}
                    >
                      <option value="">Selecione uma conta...</option>
                      {payableAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Data do pagamento</label>
                    <input
                      type="date"
                      className="input"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                    />
                  </div>

                  {error && (
                    <p className="text-sm px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handlePay}
                    disabled={!paymentAccountId || payInvoice.isPending}
                    className="btn-primary w-full justify-center py-2.5"
                  >
                    {payInvoice.isPending
                      ? 'Processando...'
                      : `Pagar ${formatCurrency(calculatedTotal)}`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center">
              <p className="text-3xl mb-3">🧾</p>
              <p className="text-sm text-[#6B7280]">
                Selecione uma fatura ou adicione uma transação
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal nova transacao pre-selecionando o cartao */}
      <Modal isOpen={showNewTx} onClose={() => setShowNewTx(false)} title="Nova transação">
        <TransactionForm
          onSuccess={() => {
            setShowNewTx(false)
            refetchTx()
          }}
        />
      </Modal>
    </div>
  )
}
