import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, getCurrentMonthRange } from '@/lib/utils/format'

describe('formatCurrency', () => {
  it('formata valor positivo em BRL', () => {
    expect(formatCurrency(1234.56)).toBe('R$\u00a01.234,56')
  })

  it('formata valor zero', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00')
  })

  it('formata valor negativo', () => {
    expect(formatCurrency(-500)).toBe('-R$\u00a0500,00')
  })

  it('formata valores com centavos', () => {
    expect(formatCurrency(10.5)).toBe('R$\u00a010,50')
  })
})

describe('formatDate', () => {
  it('formata data no padrão brasileiro', () => {
    expect(formatDate('2026-03-14')).toBe('14/03/2026')
  })

  it('formata primeiro dia do mês', () => {
    expect(formatDate('2026-01-01')).toBe('01/01/2026')
  })
})

describe('getCurrentMonthRange', () => {
  it('retorna datas no formato YYYY-MM-DD', () => {
    const { start, end } = getCurrentMonthRange()
    expect(start).toMatch(/^\d{4}-\d{2}-01$/)
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('start é sempre o dia 01', () => {
    const { start } = getCurrentMonthRange()
    expect(start.endsWith('-01')).toBe(true)
  })

  it('start é menor ou igual a end', () => {
    const { start, end } = getCurrentMonthRange()
    expect(new Date(start) <= new Date(end)).toBe(true)
  })
})