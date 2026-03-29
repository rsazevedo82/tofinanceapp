import type { Transaction } from '@/types'

export type SplitMode = 'equal' | 'manual'

export type SplitInput = {
  split_mode: SplitMode
  total_amount: number
  partner_amount?: number
  payer_share_percent?: number
}

export type ResolvedSplitValues = {
  split_mode: SplitMode
  payer_share_percent: number
  payer_amount: number
  partner_amount: number
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function computeSplitAmounts(split: {
  total_amount: number
  payer_share_percent: number
  payer_amount?: number | null
  partner_amount?: number | null
}) {
  if (typeof split.payer_amount === 'number' && typeof split.partner_amount === 'number') {
    return {
      payer_amount: round2(split.payer_amount),
      partner_amount: round2(split.partner_amount),
    }
  }

  const payer_amount = round2(split.total_amount * split.payer_share_percent / 100)
  const partner_amount = round2(split.total_amount - payer_amount)
  return { payer_amount, partner_amount }
}

export function buildEqualSplitAmounts(totalAmount: number): Pick<ResolvedSplitValues, 'payer_amount' | 'partner_amount'> {
  const total = round2(totalAmount)
  const partner_amount = round2(total / 2)
  const payer_amount = round2(total - partner_amount)
  return { payer_amount, partner_amount }
}

export function resolveSplitValues(input: SplitInput): ResolvedSplitValues {
  const total = round2(input.total_amount)

  if (input.split_mode === 'manual') {
    const partnerAmount = round2(input.partner_amount ?? 0)
    if (!(partnerAmount > 0 && partnerAmount < total)) {
      throw new Error('Valor fixo do parceiro inválido')
    }

    const payerAmount = round2(total - partnerAmount)
    const payerSharePercent = round2((payerAmount / total) * 100)
    if (!(payerSharePercent > 0 && payerSharePercent < 100)) {
      throw new Error('Percentual calculado inválido')
    }

    return {
      split_mode: 'manual',
      payer_share_percent: payerSharePercent,
      payer_amount: payerAmount,
      partner_amount: partnerAmount,
    }
  }

  const equal = buildEqualSplitAmounts(total)
  if (typeof input.payer_share_percent === 'number') {
    const payerSharePercent = round2(input.payer_share_percent)
    if (Math.abs(payerSharePercent - 50) > 0.0001) {
      const payer_amount = round2(total * payerSharePercent / 100)
      const partner_amount = round2(total - payer_amount)
      return {
        split_mode: 'manual',
        payer_share_percent: payerSharePercent,
        payer_amount,
        partner_amount,
      }
    }
  }

  return {
    split_mode: 'equal',
    payer_share_percent: 50,
    payer_amount: equal.payer_amount,
    partner_amount: equal.partner_amount,
  }
}

export function shouldAutoSplitTransaction(args: {
  hasCouple: boolean
  type: Transaction['type']
  amount: number
  deleted_at?: string | null
}): boolean {
  if (!args.hasCouple) return false
  if (args.deleted_at) return false
  if (args.type !== 'expense') return false
  return args.amount > 0
}
