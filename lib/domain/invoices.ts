// lib/domain/invoices.ts
// Logica de negocio de faturas - sem dependencia de framework

import type { Account, CreditInvoice } from '@/types'

/**
 * Calcula o mes de referencia de uma fatura dado uma data de compra.
 * Se a compra ocorre APOS o fechamento, vai para a proxima fatura.
 *
 * Exemplo: closing_day = 25
 *   compra em 20/03 → fatura "2026-03"
 *   compra em 26/03 → fatura "2026-04"
 */
export function getReferenceMonth(purchaseDate: Date, closingDay: number): string {
  const day   = purchaseDate.getDate()
  const month = purchaseDate.getMonth()  // 0-indexed
  const year  = purchaseDate.getFullYear()

  if (day <= closingDay) {
    // Compra dentro do ciclo atual
    return `${year}-${String(month + 1).padStart(2, '0')}`
  } else {
    // Compra apos fechamento - vai para o proximo ciclo
    const next = new Date(year, month + 1, 1)
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
  }
}

/**
 * Calcula a data de vencimento de uma fatura.
 * Se due_day < closing_day, o vencimento e no mes seguinte ao fechamento.
 */
export function getDueDate(referenceMonth: string, closingDay: number, dueDay: number): string {
  const [year, month] = referenceMonth.split('-').map(Number)

  // Vencimento e sempre apos o fechamento
  // Se due_day <= closing_day, vence no mes seguinte
  if (dueDay <= closingDay) {
    const next = new Date(year, month, 1) // month ja e 1-indexed, new Date(y, m, 1) = proximo mes
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
  } else {
    return `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
  }
}

/**
 * Verifica se uma fatura deveria ter fechado (fechamento automatico).
 * Retorna true se a data atual e posterior ao dia de fechamento
 * do mes de referencia da fatura.
 */
export function shouldAutoClose(invoice: CreditInvoice, closingDay: number): boolean {
  if (invoice.status !== 'open') return false

  const [year, month] = invoice.reference_month.split('-').map(Number)
  const closingDate   = new Date(year, month - 1, closingDay)
  const today         = new Date()

  // Compara apenas a data, sem hora
  today.setHours(0, 0, 0, 0)
  closingDate.setHours(0, 0, 0, 0)

  return today > closingDate
}

/**
 * Calcula o limite disponivel de um cartao.
 * limite_disponivel = credit_limit - soma das faturas abertas e fechadas (nao pagas)
 */
export function getAvailableLimit(account: Account, openInvoicesTotal: number): number {
  if (!account.credit_limit) return 0
  return account.credit_limit - openInvoicesTotal
}

/**
 * Gera as datas de cada parcela a partir da data da compra.
 * Cada parcela vai para a fatura do mes correspondente.
 */
export function getInstallmentDates(
  purchaseDate: Date,
  installmentCount: number,
  closingDay: number
): Array<{ referenceMonth: string; date: string }> {
  const result = []
  const baseDate = new Date(purchaseDate)

  for (let i = 0; i < installmentCount; i++) {
    const refMonth = getReferenceMonth(baseDate, closingDay)
    result.push({
      referenceMonth: refMonth,
      date: baseDate.toISOString().split('T')[0],
    })
    // Proxima parcela = mesmo dia, mes seguinte
    baseDate.setMonth(baseDate.getMonth() + 1)
  }

  return result
}