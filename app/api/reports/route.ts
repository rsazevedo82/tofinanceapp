// app/api/reports/route.ts
import { createClient }     from '@/lib/supabase/server'
import { getCachedReports, setCachedReports } from '@/lib/summaryCache'
import { NextResponse }     from 'next/server'
import { checkRateLimitByIP, checkRateLimitByUser }   from '@/lib/apiHelpers'
import type { ApiResponse } from '@/types'

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
  month:             string
  label:             string
  projected_income:  number
  projected_expense: number
  projected_balance: number
  is_projection:     boolean
}

export interface ReportsPayload {
  categories:  CategoryData[]
  monthly:     MonthlyData[]
  daily_flow:  DailyFlowData[]
  card_limits: CardLimitData[]
  projection:  ProjectionData[]
  period: { start: string; end: string; month: string }
}

type CategoryRow = {
  category_id: string | null
  category_name: string
  category_color: string | null
  total: number | string
  tx_count: number | string
}

type MonthlyRow = {
  month: string
  income: number | string
  expense: number | string
}

type DailyRow = {
  day: string
  income: number | string
  expense: number | string
}

type CardRow = {
  account_id: string
  name: string
  color: string | null
  credit_limit: number | string
  used: number | string
}

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

export async function GET(request: Request): Promise<NextResponse<ApiResponse<ReportsPayload>>> {
  const limited = await checkRateLimitByIP('reports:get')
  if (limited) return limited as NextResponse<ApiResponse<ReportsPayload>>

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('reports:get', user.id)
    if (userLimited) return userLimited as NextResponse<ApiResponse<ReportsPayload>>

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
    const { start, end } = monthRange(month)
    const cached = await getCachedReports<ReportsPayload>({
      userId: user.id,
      period: month,
    })

    if (cached) {
      return NextResponse.json(
        {
          data: cached,
          error: null,
        },
        {
          headers: {
            'Cache-Control': 'private, max-age=30, stale-while-revalidate=90',
          },
        }
      )
    }

    const monthsBack = 5
    const monthList  = Array.from({ length: monthsBack + 1 }, (_, i) => addMonths(month, -monthsBack + i))
    const monthlyStart = `${monthList[0]}-01`
    const daysInMonth  = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate()

    const [
      { data: categoryRows, error: categoryError },
      { data: monthlyRows, error: monthlyError },
      { data: dailyRows, error: dailyError },
      { data: cardRows, error: cardError },
    ] = await Promise.all([
      supabase.rpc('report_expense_by_category', {
        p_user_id: user.id,
        p_start: start,
        p_end: end,
      }),
      supabase.rpc('report_monthly_totals', {
        p_user_id: user.id,
        p_start: monthlyStart,
        p_end: end,
      }),
      supabase.rpc('report_daily_totals', {
        p_user_id: user.id,
        p_start: start,
        p_end: end,
      }),
      supabase.rpc('report_card_limits', {
        p_user_id: user.id,
      }),
    ])

    if (categoryError) throw categoryError
    if (monthlyError) throw monthlyError
    if (dailyError) throw dailyError
    if (cardError) throw cardError

    const safeCategoryRows = (categoryRows ?? []) as CategoryRow[]
    const safeMonthlyRows = (monthlyRows ?? []) as MonthlyRow[]
    const safeDailyRows = (dailyRows ?? []) as DailyRow[]
    const safeCardRows = (cardRows ?? []) as CardRow[]

    const totalExpenses = safeCategoryRows.reduce((sum: number, row: CategoryRow) => sum + Number(row.total), 0)

    const categories: CategoryData[] = safeCategoryRows.map((row: CategoryRow) => ({
      category_id: row.category_id,
      category_name: row.category_name,
      category_color: row.category_color,
      total: Number(row.total),
      count: Number(row.tx_count),
      percent: totalExpenses > 0 ? Math.round((Number(row.total) / totalExpenses) * 100) : 0,
    }))

    const monthlyMap = new Map(
      safeMonthlyRows.map((row: MonthlyRow) => [
        row.month,
        {
          income: Number(row.income),
          expense: Number(row.expense),
        },
      ])
    )

    const monthly: MonthlyData[] = monthList.map(ym => {
      const current = monthlyMap.get(ym) ?? { income: 0, expense: 0 }
      return {
        month: ym,
        label: monthLabel(ym),
        income: current.income,
        expense: current.expense,
        net: current.income - current.expense,
      }
    })

    const dailyMap = new Map(
      safeDailyRows.map((row: DailyRow) => [
        row.day,
        {
          income: Number(row.income),
          expense: Number(row.expense),
        },
      ])
    )

    let runningBalance = 0
    const daily_flow: DailyFlowData[] = Array.from({ length: daysInMonth }, (_, i) => {
      const day   = String(i + 1).padStart(2, '0')
      const date  = `${month}-${day}`
      const current = dailyMap.get(date) ?? { income: 0, expense: 0 }
      const inc = current.income
      const exp = current.expense
      runningBalance += inc - exp
      return { date, label: `${day}/${month.split('-')[1]}`, income: inc, expense: exp, balance: runningBalance }
    })

    const card_limits: CardLimitData[] = safeCardRows.map((row: CardRow) => {
      const limit = Number(row.credit_limit)
      const used = Number(row.used)
      return {
        account_id: row.account_id,
        name: row.name,
        color: row.color,
        credit_limit: limit,
        used,
        available: limit - used,
        percent: limit > 0 ? Math.round((used / limit) * 100) : 0,
      }
    })

    const past3    = Array.from({ length: 3 }, (_, i) => addMonths(month, -(i + 1)))

    const avgIncome = past3.reduce((sum, ym) => sum + (monthlyMap.get(ym)?.income ?? 0), 0) / 3
    const avgExpense = past3.reduce((sum, ym) => sum + (monthlyMap.get(ym)?.expense ?? 0), 0) / 3

    const { data: accs } = await supabase
      .from('accounts')
      .select('balance, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .neq('type', 'credit')

    const currentBalance      = (accs ?? []).reduce((s, a) => s + Number(a.balance), 0)
    const currentMonthIncome  = monthlyMap.get(month)?.income ?? 0
    const currentMonthExpense = monthlyMap.get(month)?.expense ?? 0

    let projBalance = currentBalance
    const projection: ProjectionData[] = [
      { month, label: monthLabel(month), projected_income: currentMonthIncome,
        projected_expense: currentMonthExpense, projected_balance: currentBalance, is_projection: false },
      ...Array.from({ length: 3 }, (_, i) => {
        const ym = addMonths(month, i + 1)
        projBalance += avgIncome - avgExpense
        return { month: ym, label: monthLabel(ym), projected_income: avgIncome,
          projected_expense: avgExpense, projected_balance: projBalance, is_projection: true }
      }),
    ]

    const payload: ReportsPayload = {
      categories,
      monthly,
      daily_flow,
      card_limits,
      projection,
      period: { start, end, month },
    }

    await setCachedReports({
      userId: user.id,
      period: month,
      value: payload,
    })

    return NextResponse.json(
      {
        data: payload,
        error: null,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=90',
        },
      }
    )
  } catch (err) {
    console.error('[GET /api/reports]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
