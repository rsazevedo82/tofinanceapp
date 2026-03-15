import { z } from 'zod'

// Regex reutilizáveis
const safeString = (max: number) =>
  z.string()
    .max(max)
    .trim()
    .refine(val => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(val), {
      message: 'Caracteres inválidos detectados',
    })

const hexColor = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida — use formato #RRGGBB')
  .optional()

const isoDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida — use formato YYYY-MM-DD')
  .refine(val => {
    const d = new Date(val)
    return !isNaN(d.getTime())
  }, 'Data inválida')
  .refine(val => {
    // Bloqueia datas absurdas (ex: ano 9999 ou 1800)
    const year = parseInt(val.split('-')[0])
    return year >= 2000 && year <= 2100
  }, 'Data fora do intervalo permitido')

export const createAccountSchema = z.object({
  name:     safeString(100).min(1, 'Nome é obrigatório'),
  type:     z.enum(['checking', 'savings', 'credit', 'investment', 'wallet']),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/, 'Moeda inválida').default('BRL'),
  balance:  z.number().min(-999999999).max(999999999).default(0),
  color:    hexColor,
  icon:     safeString(50).optional(),
})

export const createTransactionSchema = z.object({
  account_id:  z.string().uuid('Conta inválida'),
  category_id: z.string().uuid('Categoria inválida').optional(),
  type:        z.enum(['income', 'expense', 'transfer']),
  amount:      z.number()
                 .positive('Valor deve ser maior que zero')
                 .max(999999999.99, 'Valor excede o limite permitido')
                 .refine(val => {
                   // Máximo 2 casas decimais
                   return Math.round(val * 100) / 100 === val
                 }, 'Valor com mais de 2 casas decimais'),
  description: safeString(255).min(1, 'Descrição é obrigatória'),
  notes:       safeString(1000).optional(),
  date:        isoDate,
  status:      z.enum(['confirmed', 'pending', 'cancelled']).default('confirmed'),
})

export type CreateAccountInput     = z.infer<typeof createAccountSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
