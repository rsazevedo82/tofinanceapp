// app/api/reports/route.ts
import { createClient }        from '@/lib/supabase/server'
import { NextResponse }        from 'next/server'
import type { ApiResponse }    from '@/types'

// ── Tipos de retorno ──────────────────────────────────────────────────────────

export interface CategoryData {
  category_id:   string | null
  category_name: string
  category_color: string | null
  total:         number
  percent:       number
  count:         number
}

export interface MonthlyData {
  month:   string   // "2026-03"
  label:   string   // "Mar/26"
  income:  number
  expense: number
  net:     number
}

export interface DailyFlowData {
  date:           string
  label:          string
  income:         number
  expense:        number
  balance:        number   // acumulado do dia
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
  month:           string
  label:           string
  projected_income:   number
  projected_expense:  number
  projected_balance:  number
  is_projection:   boolean
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`
}

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthRange(ym: string): { start: string; end: string } {
  const [y, m] = ym.split('-').map(Number)
  const start  = `${ym}-01`
  const end    = new Date(y, m, 0).toISOString().split('T')[0]
  return { start, end }
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function GET(request: Request): Promise<NextResponse<ApiResponse<ReportsPayload>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
    const { start, end } = monthRange(month)

    // ── 1. Transacoes do mes ──────────────────────────────────────────────────
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .eq('status', 'confirmed')
      .is('deleted_at', null)

    if (txError) throw txError
    const transactions = txs ?? []

    // ── 2. Categorias ─────────────────────────────────────────────────────────
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name, color')
      .or(`user_id.is.null,user_id.eq.${user.id}`)

    const catMap = Object.fromEntries((cats ?? []).map(c => [c.id, c]))

    const expenseTxs    = transactions.filter(t => t.type === 'expense')
    const totalExpenses = expenseTxs.reduce((s, t) => s + Number(t.amount), 0)

    const catTotals = new Map<string, { total: number; count: number; color: string | null; name: string }>()

    for (const tx of expenseTxs) {
      const key  = tx.category_id ?? '__none__'
      const cat  = tx.category_id ? catMap[tx.category_id] : null
      const name = cat?.name ?? 'Sem categoria'
      const color = cat?.color ?? '#94a3b8'
      const existing = catTotals.get(key)
      if (existing) {
        existing.total += Number(tx.amount)
        existing.count++
      } else {
        catTotals.set(key, { total: Number(tx.amount), count: 1, color, name })
      }
    }

    const categories: CategoryData[] = Array.from(catTotals.entries())
      .map(([id, v]) => ({
        category_id:    id === '__none__' ? null : id,
        category_name:  v.name,
        category_color: v.color,
        total:          v.total,
        count:          v.count,
        percent:        totalExpenses > 0 ? Math.round((v.total / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)

    // ── 3. Evolucao mensal (6 meses) ──────────────────────────────────────────
    const monthsBack = 5
    const monthList  = Array.from({ length: monthsBack + 1 }, (_, i) =>
      addMonths(month, -monthsBack + i)
    )

    const { data: allTxs } = await supabase
      .from('transactions')
      .select('type, amount, date')
      .eq('user_id', user.id)
      .gte('date', `${monthList[0]}-01`)
      .lte('date', end)
      .eq('status', 'confirmed')
      .is('deleted_at', null)

    const monthly: MonthlyData[] = monthList.map(ym => {
      const { start: s, end: e } = monthRange(ym)
      const mTxs = (allTxs ?? []).filter(t => t.date >= s && t.date <= e)
      const income  = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const expense = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      return { month: ym, label: monthLabel(ym), income, expense, net: income - expense }
    })

    // ── 4. Fluxo diario do mes ────────────────────────────────────────────────
    const daysInMonth = new Date(
      parseInt(month.split('-')[0]),
      parseInt(month.split('-')[1]),
      0
    ).getDate()

    let runningBalance = 0
    const daily_flow: DailyFlowData[] = Array.from({ length: daysInMonth }, (_, i) => {
      const day   = String(i + 1).padStart(2, '0')
      const date  = `${month}-${day}`
      const dayTx = transactions.filter(t => t.date === date)
      const inc   = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const exp   = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      runningBalance += inc - exp
      return {
        date,
        label:   `${day}/${month.split('-')[1]}`,
        income:  inc,
        expense: exp,
        balance: runningBalance,
      }
    })

    // ── 5. Limites dos cartoes ────────────────────────────────────────────────
    const { data: creditAccounts } = await supabase
      .from('accounts')
      .select('id, name, color, credit_limit')
      .eq('user_id', user.id)
      .eq('type', 'credit')
      .eq('is_active', true)
      .is('deleted_at', null)
      .not('credit_limit', 'is', null)

    const { data: openInvoices } = await supabase
      .from('credit_invoices')
      .select('account_id, total_amount')
      .eq('user_id', user.id)
      .neq('status', 'paid')

    const invoiceByAccount = new Map<string, number>()
    for (const inv of openInvoices ?? []) {
      const prev = invoiceByAccount.get(inv.account_id) ?? 0
      invoiceByAccount.set(inv.account_id, prev + Number(inv.total_amount))
    }

    const card_limits: CardLimitData[] = (creditAccounts ?? []).map(acc => {
      const used      = invoiceByAccount.get(acc.id) ?? 0
      const limit     = Number(acc.credit_limit)
      const available = limit - used
      return {
        account_id:   acc.id,
        name:         acc.name,
        color:        acc.color,
        credit_limit: limit,
        used,
        available,
        percent:      limit > 0 ? Math.round((used / limit) * 100) : 0,
      }
    })

    // ── 6. Projecao (media 3 meses -> proximos 3 meses) ───────────────────────
    const past3 = Array.from({ length: 3 }, (_, i) => addMonths(month, -(i + 1)))

    const { data: past3Txs } = await supabase
      .from('transactions')
      .select('type, amount, date')
      .eq('user_id', user.id)
      .gte('date', `${past3[2]}-01`)
      .lte('date', `${past3[0]}-${new Date(
        parseInt(past3[0].split('-')[0]),
        parseInt(past3[0].split('-')[1]),
        0
      ).getDate()}`)
      .eq('status', 'confirmed')
      .is('deleted_at', null)

    const avgIncome  = past3.reduce((s, ym) => {
      const { start: s2, end: e2 } = monthRange(ym)
      return s + (past3Txs ?? []).filter(t => t.date >= s2 && t.date <= e2 && t.type === 'income')
        .reduce((a, t) => a + Number(t.amount), 0)
    }, 0) / 3

    const avgExpense = past3.reduce((s, ym) => {
      const { start: s2, end: e2 } = monthRange(ym)
      return s + (past3Txs ?? []).filter(t => t.date >= s2 && t.date <= e2 && t.type === 'expense')
        .reduce((a, t) => a + Number(t.amount), 0)
    }, 0) / 3

    // Busca saldo atual das contas
    const { data: accs } = await supabase
      .from('accounts')
      .select('balance, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .neq('type', 'credit')

    const currentBalance = (accs ?? []).reduce((s, a) => s + Number(a.balance), 0)

    const currentMonthIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const currentMonthExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

    let projBalance = currentBalance
    const projection: ProjectionData[] = [
      {
        month,
        label:              monthLabel(month),
        projected_income:   currentMonthIncome,
        projected_expense:  currentMonthExpense,
        projected_balance:  currentBalance,
        is_projection:      false,
      },
      ...Array.from({ length: 3 }, (_, i) => {
        const ym = addMonths(month, i + 1)
        projBalance += avgIncome - avgExpense
        return {
          month:             ym,
          label:             monthLabel(ym),
          projected_income:  avgIncome,
          projected_expense: avgExpense,
          projected_balance: projBalance,
          is_projection:     true,
        }
      }),
    ]

    return NextResponse.json({
      data: {
        categories,
        monthly,
        daily_flow,
        card_limits,
        projection,
        period: { start, end, month },
      },
      error: null,
    })
  } catch (err) {
    console.error('[GET /api/reports]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}