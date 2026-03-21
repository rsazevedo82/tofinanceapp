import { createClient } from '@/lib/supabase/server'
import { getCurrentMonthRange } from '@/lib/utils/format'
import type { ApiResponse, DashboardSummary } from '@/types'
import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse<ApiResponse<DashboardSummary>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { start, end } = getCurrentMonthRange()

    // Busca em paralelo para melhor performance
    const [accountsResult, transactionsResult] = await Promise.all([
      supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name'),

      supabase
        .from('transactions')
        .select(`
          *,
          account:accounts(id, name, color, icon),
          category:categories(id, name, color, icon)
        `)
        .gte('date', start)
        .lte('date', end)
        .eq('status', 'confirmed')
        .order('date', { ascending: false }),
    ])

    if (accountsResult.error) throw accountsResult.error
    if (transactionsResult.error) throw transactionsResult.error

    const accounts = accountsResult.data ?? []
    const transactions = transactionsResult.data ?? []

    // Calcular totais do mês
    const income_this_month = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expense_this_month = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const total_balance = accounts
      .reduce((sum, a) => sum + Number(a.balance), 0)

    // Gastos agrupados por categoria
    const categoryMap = new Map<string, {
      category_id: string
      category_name: string
      category_color: string | null
      total: number
    }>()

    transactions
      .filter(t => t.type === 'expense' && t.category)
      .forEach(t => {
        const cat = t.category!
        const existing = categoryMap.get(cat.id)
        if (existing) {
          existing.total += Number(t.amount)
        } else {
          categoryMap.set(cat.id, {
            category_id: cat.id,
            category_name: cat.name,
            category_color: cat.color,
            total: Number(t.amount),
          })
        }
      })

    const expenses_by_category = Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total)

    const summary: DashboardSummary = {
      total_balance,
      income_this_month,
      expense_this_month,
      net_this_month: income_this_month - expense_this_month,
      accounts,
      recent_transactions: transactions.slice(0, 5),
      expenses_by_category,
    }

    return NextResponse.json({ data: summary, error: null })
  } catch (err) {
    console.error('[GET /api/dashboard]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}