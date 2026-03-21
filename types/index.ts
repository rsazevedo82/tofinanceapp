// types/index.ts
// Adicione estes tipos ao seu arquivo types/index.ts existente

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'wallet'

export interface Account {
  id:               string
  user_id:          string
  name:             string
  type:             AccountType
  balance:          number
  currency:         string
  color:            string | null
  icon:             string | null
  is_active:        boolean
  deleted_at:       string | null
  created_at:       string
  updated_at:       string
  // Campos de cartao de credito
  credit_limit:     number | null
  closing_day:      number | null
  due_day:          number | null
}

export type InvoiceStatus = 'open' | 'closed' | 'paid'

export interface CreditInvoice {
  id:               string
  account_id:       string
  user_id:          string
  reference_month:  string   // "2026-03"
  status:           InvoiceStatus
  due_date:         string
  total_amount:     number
  closed_at:        string | null
  paid_at:          string | null
  created_at:       string
  updated_at:       string
}

export interface InstallmentGroup {
  id:                string
  user_id:           string
  account_id:        string
  description:       string
  total_amount:      number
  installment_count: number
  created_at:        string
}

export interface Transaction {
  id:                   string
  user_id:              string
  account_id:           string
  category_id:          string | null
  invoice_id:           string | null
  installment_group_id: string | null
  installment_number:   number | null
  type:                 'income' | 'expense' | 'transfer'
  amount:               number
  description:          string
  notes:                string | null
  date:                 string
  status:               'confirmed' | 'pending' | 'cancelled'
  deleted_at:           string | null
  created_at:           string
  updated_at:           string
}

export interface Category {
  id:         string
  user_id:    string | null
  name:       string
  type:       'income' | 'expense'
  color:      string | null
  icon:       string | null
  is_active:  boolean
  deleted_at: string | null
}

export interface ApiResponse<T> {
  data:  T | null
  error: string | null
}