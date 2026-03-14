import { describe, it, expect } from 'vitest'
import { createTransactionSchema, createAccountSchema } from '@/lib/validations/schemas'

describe('createTransactionSchema', () => {

  const validTransaction = {
    account_id:  '123e4567-e89b-12d3-a456-426614174000',
    type:        'expense' as const,
    amount:      50.00,
    description: 'Almoço',
    date:        '2026-03-14',
    status:      'confirmed' as const,
  }

  it('aceita transação válida', () => {
    const result = createTransactionSchema.safeParse(validTransaction)
    expect(result.success).toBe(true)
  })

  it('rejeita amount zero', () => {
    const result = createTransactionSchema.safeParse({ ...validTransaction, amount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejeita amount negativo', () => {
    const result = createTransactionSchema.safeParse({ ...validTransaction, amount: -10 })
    expect(result.success).toBe(false)
  })

  it('rejeita descrição vazia', () => {
    const result = createTransactionSchema.safeParse({ ...validTransaction, description: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita descrição com mais de 255 caracteres', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      description: 'a'.repeat(256),
    })
    expect(result.success).toBe(false)
  })

  it('rejeita data em formato inválido', () => {
    const result = createTransactionSchema.safeParse({ ...validTransaction, date: '14/03/2026' })
    expect(result.success).toBe(false)
  })

  it('rejeita account_id que não é UUID', () => {
    const result = createTransactionSchema.safeParse({ ...validTransaction, account_id: 'abc123' })
    expect(result.success).toBe(false)
  })

  it('aplica status confirmed por padrão', () => {
    const { status: _, ...withoutStatus } = validTransaction
    const result = createTransactionSchema.safeParse(withoutStatus)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('confirmed')
    }
  })

  it('aceita category_id opcional', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      category_id: undefined,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita type inválido', () => {
    const result = createTransactionSchema.safeParse({ ...validTransaction, type: 'invalid' })
    expect(result.success).toBe(false)
  })
})

describe('createAccountSchema', () => {

  const validAccount = {
    name: 'Nubank',
    type: 'checking' as const,
  }

  it('aceita conta válida', () => {
    const result = createAccountSchema.safeParse(validAccount)
    expect(result.success).toBe(true)
  })

  it('aplica currency BRL por padrão', () => {
    const result = createAccountSchema.safeParse(validAccount)
    if (result.success) {
      expect(result.data.currency).toBe('BRL')
    }
  })

  it('aplica balance zero por padrão', () => {
    const result = createAccountSchema.safeParse(validAccount)
    if (result.success) {
      expect(result.data.balance).toBe(0)
    }
  })

  it('rejeita nome vazio', () => {
    const result = createAccountSchema.safeParse({ ...validAccount, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita type inválido', () => {
    const result = createAccountSchema.safeParse({ ...validAccount, type: 'crypto' })
    expect(result.success).toBe(false)
  })

  it('remove espaços do nome com trim', () => {
    const result = createAccountSchema.safeParse({ ...validAccount, name: '  Nubank  ' })
    if (result.success) {
      expect(result.data.name).toBe('Nubank')
    }
  })
})