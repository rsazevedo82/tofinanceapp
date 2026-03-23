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

// ── Couple ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id:         string
  name:       string | null
  avatar_url: string | null
  updated_at: string
}

export interface CoupleProfile {
  id:        string
  user_id_1: string
  user_id_2: string
  linked_at: string
  created_at: string
  // join
  partner?:  UserProfile
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface CoupleInvitation {
  id:            string
  inviter_id:    string
  invitee_email: string
  invitee_id:    string | null
  token:         string
  status:        InvitationStatus
  expires_at:    string
  created_at:    string
}

// ── Notifications ──────────────────────────────────────────────────────────────

export type NotificationType =
  | 'couple_invite'
  | 'couple_accepted'
  | 'couple_unlinked'
  | 'goal_reached'
  | 'invoice_closed'

export interface Notification {
  id:         string
  user_id:    string
  type:       NotificationType
  title:      string
  body:       string
  payload:    Record<string, unknown>
  read_at:    string | null
  created_at: string
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface CategoryData {
  category_id:    string | null
  category_name:  string
  category_color: string | null
  total:          number
  percent:        number
  count:          number
}

export interface MonthlyData {
  month:   string
  label:   string
  income:  number
  expense: number
  net:     number
}

export interface DailyFlowData {
  date:    string
  label:   string
  income:  number
  expense: number
  balance: number
}

export interface CardLimitData {
  account_id:   string
  name:         string
  color:        string | null
  credit_limit: number
  used:         number
  available:    number
  percent:      number
}

export interface ProjectionData {
  month:               string
  label:               string
  projected_income:    number
  projected_expense:   number
  projected_balance:   number
  is_projection:       boolean
}

export interface ReportsPayload {
  categories:  CategoryData[]
  monthly:     MonthlyData[]
  daily_flow:  DailyFlowData[]
  card_limits: CardLimitData[]
  projection:  ProjectionData[]
  period: {
    start: string
    end:   string
    month: string
  }
}