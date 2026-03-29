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

// ── Goals ─────────────────────────────────────────────────────────────────────

export const createGoalSchema = z.object({
  title:         safeString(100).min(1, 'Título é obrigatório'),
  description:   safeString(500).optional(),
  icon:          safeString(10).default('⭐'),
  color:         hexColor.default('#818cf8' as `#${string}`),
  category:      z.enum(['travel','property','emergency','education','vehicle','wedding','family','tech','health','custom']).default('custom'),
  account_id:    z.string().uuid().optional(),
  target_amount: z.number().positive('Valor alvo deve ser maior que zero').max(999999999),
  deadline:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  couple_id:     z.string().uuid().optional(),
})

export const updateGoalSchema = z.object({
  title:         safeString(100).min(1).optional(),
  description:   safeString(500).optional(),
  icon:          safeString(10).optional(),
  color:         hexColor,
  category:      z.enum(['travel','property','emergency','education','vehicle','wedding','family','tech','health','custom']).optional(),
  account_id:    z.string().uuid().optional().nullable(),
  target_amount: z.number().positive().max(999999999).optional(),
  deadline:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status:        z.enum(['active','completed','archived']).optional(),
})

export const addContributionSchema = z.object({
  amount: z.number().positive('Valor deve ser maior que zero').max(999999999),
  notes:  safeString(255).optional(),
  date:   isoDate,
})

// ── Expense Splits ────────────────────────────────────────────────────────────

export const createSplitSchema = z.object({
  couple_id:           z.string().uuid('Perfil de casal inválido'),
  description:         safeString(255).min(1, 'Descrição é obrigatória'),
  date:                isoDate,
  total_amount:        z.number().positive('Valor deve ser maior que zero').max(999999999),
  split_mode:          z.enum(['equal', 'manual']).default('equal'),
  partner_amount:      z.number().positive('Valor do parceiro deve ser maior que zero').max(999999999).optional(),
  // Mantido por compatibilidade com payload antigo.
  payer_share_percent: z.number()
                         .min(0.01, 'Percentual mínimo é 0,01%')
                         .max(99.99, 'Percentual máximo é 99,99%')
                         .optional(),
}).superRefine((data, ctx) => {
  if (data.split_mode !== 'manual') return

  if (data.partner_amount == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['partner_amount'],
      message: 'Informe o valor fixo do parceiro',
    })
    return
  }

  if (data.partner_amount >= data.total_amount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['partner_amount'],
      message: 'Valor do parceiro deve ser menor que o valor total',
    })
  }
})

export const settleSplitSchema = z.object({
  settled_at: z.string().datetime({ message: 'Data de quitação inválida' }),
})

// ── Tipos exportados ──────────────────────────────────────────────────────────

export type CreateAccountInput     = z.infer<typeof createAccountSchema>
export type UpdateAccountInput     = z.infer<typeof updateAccountSchema>
export type CreateCategoryInput    = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput    = z.infer<typeof updateCategorySchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type CreateGoalInput        = z.infer<typeof createGoalSchema>
export type UpdateGoalInput        = z.infer<typeof updateGoalSchema>
export type AddContributionInput   = z.infer<typeof addContributionSchema>
export type PayInvoiceInput        = z.infer<typeof payInvoiceSchema>
export type CreateSplitInput       = z.infer<typeof createSplitSchema>
export type SettleSplitInput       = z.infer<typeof settleSplitSchema>
// ── Profile ───────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name:  safeString(100).min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').max(255).optional(),
}).refine(data => data.name !== undefined || data.email !== undefined, {
  message: 'Informe ao menos um campo para atualizar',
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe sua senha atual'),
  newPassword: z.string()
    .min(10, 'Nova senha deve ter pelo menos 10 caracteres')
    .refine(val => /[a-zA-Z]/.test(val) && /[0-9]/.test(val), {
      message: 'Nova senha deve conter letras e números',
    }),
})

export type UpdateProfileInput  = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
