import { describe, expect, it } from 'vitest'
import {
  buildEqualSplitAmounts,
  computeSplitAmounts,
  resolveSplitValues,
  shouldAutoSplitTransaction,
} from '@/lib/splitLogic'

describe('splitLogic.resolveSplitValues', () => {
  it('resolve modo equal em 50/50', () => {
    const result = resolveSplitValues({
      split_mode: 'equal',
      total_amount: 100,
    })

    expect(result.split_mode).toBe('equal')
    expect(result.payer_share_percent).toBe(50)
    expect(result.payer_amount).toBe(50)
    expect(result.partner_amount).toBe(50)
  })

  it('resolve modo manual por valor fixo', () => {
    const result = resolveSplitValues({
      split_mode: 'manual',
      total_amount: 120,
      partner_amount: 30,
    })

    expect(result.split_mode).toBe('manual')
    expect(result.partner_amount).toBe(30)
    expect(result.payer_amount).toBe(90)
    expect(result.payer_share_percent).toBe(75)
  })

  it('interpreta payload legado com percentual customizado como manual', () => {
    const result = resolveSplitValues({
      split_mode: 'equal',
      total_amount: 100,
      payer_share_percent: 80,
    })

    expect(result.split_mode).toBe('manual')
    expect(result.payer_amount).toBe(80)
    expect(result.partner_amount).toBe(20)
  })

  it('falha quando partner_amount manual invalido', () => {
    expect(() =>
      resolveSplitValues({
        split_mode: 'manual',
        total_amount: 100,
        partner_amount: 100,
      })
    ).toThrowError(/inv[aá]lido/i)
  })
})

describe('splitLogic.computeSplitAmounts', () => {
  it('prioriza valores persistidos quando existem', () => {
    const result = computeSplitAmounts({
      total_amount: 200,
      payer_share_percent: 50,
      payer_amount: 130,
      partner_amount: 70,
    })

    expect(result.payer_amount).toBe(130)
    expect(result.partner_amount).toBe(70)
  })

  it('calcula por percentual quando nao ha valores persistidos', () => {
    const result = computeSplitAmounts({
      total_amount: 200,
      payer_share_percent: 75,
    })

    expect(result.payer_amount).toBe(150)
    expect(result.partner_amount).toBe(50)
  })
})

describe('splitLogic.buildEqualSplitAmounts', () => {
  it('preserva soma exata com arredondamento de centavos', () => {
    const result = buildEqualSplitAmounts(100.01)
    expect(result.payer_amount + result.partner_amount).toBeCloseTo(100.01, 2)
  })
})

describe('splitLogic.shouldAutoSplitTransaction', () => {
  it('aceita apenas despesa positiva com casal ativo', () => {
    expect(shouldAutoSplitTransaction({
      hasCouple: true,
      type: 'expense',
      amount: 1,
    })).toBe(true)
  })

  it('bloqueia transfer e receita', () => {
    expect(shouldAutoSplitTransaction({
      hasCouple: true,
      type: 'transfer',
      amount: 100,
    })).toBe(false)

    expect(shouldAutoSplitTransaction({
      hasCouple: true,
      type: 'income',
      amount: 100,
    })).toBe(false)
  })

  it('bloqueia sem casal ou com deleted_at', () => {
    expect(shouldAutoSplitTransaction({
      hasCouple: false,
      type: 'expense',
      amount: 100,
    })).toBe(false)

    expect(shouldAutoSplitTransaction({
      hasCouple: true,
      type: 'expense',
      amount: 100,
      deleted_at: new Date().toISOString(),
    })).toBe(false)
  })
})
