import { z } from 'zod'

export const createAccountSchema = z.object({
  name:     z.string().min(1, 'Nome é obrigatório').max(100).trim(),
  type:     z.enum(['checking', 'savings', 'credit', 'investment', 'wallet']),
  currency: z.string().length(3).default('BRL'),
  balance:  z.number().default(0),
  color:    z.string().optional(),
  icon:     z.string().optional(),
})

export const createTransactionSchema = z.object({
  account_id:  z.string().uuid('Conta inválida'),
  category_id: z.string().uuid('Categoria inválida').optional(),
  type:        z.enum(['income', 'expense', 'transfer']),
  amount:      z.number().positive('Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória').max(255).trim(),
  notes:       z.string().max(1000).trim().optional(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  status:      z.enum(['confirmed', 'pending', 'cancelled']).default('confirmed'),
})

export type CreateAccountInput  = z.infer<typeof createAccountSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>