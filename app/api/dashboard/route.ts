// app/api/dashboard/route.ts
import { createClient }          from '@/lib/supabase/server'
import { getCurrentMonthRange }  from '@/lib/utils/format'
import type { ApiResponse }      from '@/types'
import { NextResponse }          from 'next/server'

type DashboardMonthlyRow = {
  month: string
  income: number | string
  expense: number | string
}

type DashboardCategoryRow = {
  category_id: string | null
  category_name: string
  category_color: string | null
  total: number | string
  tx_count: number | string
}

export interface DashboardData {
  // Saldo real (apenas contas, sem cartoes)
  total_balance:     number
  // Mes atual
  income_month:      number
  expense_month:     number
  net_month:         number
  // Cartoes
  cards: {
    id:           string
    name:         string
    color:        string | null
    credit_limit: number
    open_invoice: number
    available:    number
    closing_day:  number
    due_day:      number
  }[]
  // Transacoes recentes
  recent_transactions: {
    id:          string
    description: string
    amount:      number
    type:        string
    date:        string
    category_name: string | null
    category_color: string | null
    account_name:  string | null
  }[]
  // Top categorias do mes
  top_categories: {
    name:    string
    color:   string | null
    total:   number
    percent: number
  }[]
  period: { start: string; end: string }
}

export async function GET(): Promise<NextResponse<ApiResponse<DashboardData>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const { start, end } = getCurrentMonthRange()

    // Busca tudo em paralelo
    const [accountsRes, recentTxRes, invoicesRes, monthlyRes, categoryRes] = await Promise.all([
      supabase
        .from('accounts')
        .select('id, name, type, balance, color, credit_limit, closing_day, due_day')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name'),

      supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          date,
          description,
          account_id,
          category:categories(id, name, color)
        `)
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .eq('status', 'confirmed')
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8),

      supabase
        .from('credit_invoices')
        .select('account_id, total_amount, status')
        .eq('user_id', user.id)
        .neq('status', 'paid'),

      supabase.rpc('report_monthly_totals', {
        p_user_id: user.id,
        p_start: start,
        p_end: end,
      }),

      supabase.rpc('report_expense_by_category', {
        p_user_id: user.id,
        p_start: start,
        p_end: end,
      }),
    ])

    const accounts = accountsRes.data ?? []
    const recentTxs = recentTxRes.data ?? []
    const invoices = invoicesRes.data ?? []
    const monthlyRows = (monthlyRes.data ?? []) as DashboardMonthlyRow[]
    const categoryRows = (categoryRes.data ?? []) as DashboardCategoryRow[]

    const accMap = Object.fromEntries(accounts.map(a => [a.id, a.name]))

    // Saldo real: apenas contas nao-cartao
    const total_balance = accounts
      .filter(a => a.type !== 'credit')
      .reduce((s, a) => s + Number(a.balance), 0)

    // Totais do mês via agregação SQL
    const monthAgg = monthlyRows[0]
    const income_month = monthAgg ? Number(monthAgg.income) : 0
    const expense_month = monthAgg ? Number(monthAgg.expense) : 0

    // Fatura aberta por cartao
    const openByCard = new Map<string, number>()
    for (const inv of invoices) {
      const prev = openByCard.get(inv.account_id) ?? 0
      openByCard.set(inv.account_id, prev + Number(inv.total_amount))
    }

    // Cartoes
    const cards = accounts
      .filter(a => a.type === 'credit' && a.credit_limit)
      .map(a => {
        const open      = openByCard.get(a.id) ?? 0
        const limit     = Number(a.credit_limit)
        return {
          id:           a.id,
          name:         a.name,
          color:        a.color,
          credit_limit: limit,
          open_invoice: open,
          available:    limit - open,
          closing_day:  a.closing_day ?? 0,
          due_day:      a.due_day     ?? 0,
        }
      })

    // Transações recentes (limitadas no SELECT)
    const recent_transactions = recentTxs.map(t => {
      const category = Array.isArray(t.category) ? t.category[0] : t.category

      return {
        id:             t.id,
        description:    t.description,
        amount:         Number(t.amount),
        type:           t.type,
        date:           t.date,
        category_name:  category?.name ?? null,
        category_color: category?.color ?? null,
        account_name:   accMap[t.account_id] ?? null,
      }
    })

    // Top categorias (despesas do mês) via agregação SQL
    const top_categories = categoryRows
      .slice(0, 5)
      .map((row) => {
        const total = Number(row.total)
        return {
          name: row.category_name,
          color: row.category_color,
          total,
          percent: expense_month > 0 ? Math.round((total / expense_month) * 100) : 0,
        }
      })

    return NextResponse.json({
      data: {
        total_balance,
        income_month,
        expense_month,
        net_month: income_month - expense_month,
        cards,
        recent_transactions,
        top_categories,
        period: { start, end },
      },
      error: null,
    })
  } catch (err) {
    console.error('[GET /api/dashboard]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
