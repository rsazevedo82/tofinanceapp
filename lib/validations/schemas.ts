// lib/validations/schemas.ts
import { z } from 'zod'

const safeString = (max: number) =>
  z.string()
    .max(max)
    .trim()
    .refine(val => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(val), {
      message: 'Caracteres invalidos detectados',
    })

const hexColor = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor invalida - use formato #RRGGBB')
  .optional()

const isoDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida - use formato YYYY-MM-DD')
  .refine(val => !isNaN(new Date(val).getTime()), 'Data invalida')
  .refine(val => {
    const year = parseInt(val.split('-')[0])
    return year >= 2000 && year <= 2100
  }, 'Data fora do intervalo permitido')

// ── Account ───────────────────────────────────────────────────────────────────

export const createAccountSchema = z.object({
  name:            safeString(100).min(1, 'Nome e obrigatorio'),
  type:            z.enum(['checking', 'savings', 'credit', 'investment', 'wallet']),
  currency:        z.string().length(3).regex(/^[A-Z]{3}$/).default('BRL'),
  color:           hexColor,
  icon:            safeString(50).optional(),
  initial_balance: z.number().min(0).max(999999999).optional(),
  // Campos de cartao (obrigatorios se type === 'credit')
  credit_limit:    z.number().positive().max(999999999).optional(),
  closing_day:     z.number().int().min(1).max(31).optional(),
  due_day:         z.number().int().min(1).max(31).optional(),
}).refine(data => {
  if (data.type === 'credit') {
    return data.credit_limit != null && data.closing_day != null && data.due_day != null
  }
  return true
}, {
  message: 'Cartao de credito requer limite, dia de fechamento e dia de vencimento',
  path: ['credit_limit'],
})

export const updateAccountSchema = z.object({
  name:          safeString(100).min(1).optional(),
  type:          z.enum(['checking', 'savings', 'credit', 'investment', 'wallet']).optional(),
  color:         hexColor,
  icon:          safeString(50).optional(),
  is_active:     z.boolean().optional(),
  credit_limit:  z.number().positive().max(999999999).optional(),
  closing_day:   z.number().int().min(1).max(31).optional(),
  due_day:       z.number().int().min(1).max(31).optional(),
})

// ── Category ──────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name:  safeString(100).min(1, 'Nome e obrigatorio'),
  type:  z.enum(['income', 'expense']),
  color: hexColor,
  icon:  safeString(50).optional(),
})

export const updateCategorySchema = z.object({
  name:      safeString(100).min(1).optional(),
  color:     hexColor,
  icon:      safeString(50).optional(),
  is_active: z.boolean().optional(),
})

// ── Transaction ───────────────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  account_id:        z.string().uuid('Conta invalida'),
  category_id:       z.string().uuid('Categoria invalida').optional(),
  invoice_id:        z.string().uuid().optional(),
  type:              z.enum(['income', 'expense', 'transfer']),
  amount:            z.number()
                       .positive('Valor deve ser maior que zero')
                       .max(999999999.99)
                       .refine(val => Math.round(val * 100) / 100 === val, {
                         message: 'Valor com mais de 2 casas decimais',
                       }),
  description:       safeString(255).min(1, 'Descricao e obrigatoria'),
  notes:             safeString(1000).optional(),
  date:              isoDate,
  status:            z.enum(['confirmed', 'pending', 'cancelled']).default('confirmed'),
  // Parcelamento
  installments:      z.number().int().min(1).max(48).default(1),
})

// ── Invoice ───────────────────────────────────────────────────────────────────

export const payInvoiceSchema = z.object({
  payment_account_id: z.string().uuid('Conta de pagamento invalida'),
  amount:             z.number().positive('Valor deve ser maior que zero'),
  payment_date:       isoDate,
})

// ── Tipos exportados ──────────────────────────────────────────────────────────

export type CreateAccountInput     = z.infer<typeof createAccountSchema>
export type UpdateAccountInput     = z.infer<typeof updateAccountSchema>
export type CreateCategoryInput    = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput    = z.infer<typeof updateCategorySchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type PayInvoiceInput        = z.infer<typeof payInvoiceSchema>