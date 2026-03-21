export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'wallet'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type TransactionStatus = 'confirmed' | 'pending' | 'cancelled'
export type CategoryType = 'income' | 'expense'

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  currency: string
  balance: number
  color: string | null
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  type: CategoryType
  color: string | null
  icon: string | null
  is_active: boolean
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  description: string
  notes: string | null
  date: string
  status: TransactionStatus
  created_at: string
  updated_at: string
  account?: Pick<Account, 'id' | 'name' | 'color' | 'icon'>
  category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'>
}

export interface DashboardSummary {
  total_balance: number
  income_this_month: number
  expense_this_month: number
  net_this_month: number
  accounts: Account[]
  recent_transactions: Transaction[]
  expenses_by_category: {
    category_id: string
    category_name: string
    category_color: string | null
    total: number
  }[]
}

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }