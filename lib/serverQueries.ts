import { createClient } from '@/lib/supabase/server'
import {
  getActiveCoupleByUserId,
  getAuthUserById,
  getLatestReceivedPendingInvitation,
  getPendingInvitationByInviter,
  getUserProfileById,
  getUserProfileNameById,
} from '@/lib/privileged/coupleAdmin'
import type {
  Account,
  CardOverviewItem,
  CoupleInvitation,
  CoupleProfile,
  CreditInvoice,
  Goal,
  Notification,
  ReportsPayload,
  Transaction,
  UserProfile,
} from '@/types'
import type { DashboardData } from '@/app/api/dashboard/route'
import type { ReceivedCoupleInvite } from '@/hooks/useCouple'

type AuthenticatedContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  user: { id: string; email?: string }
}

type GoalScope = 'individual' | 'couple' | 'all'

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[parseInt(m, 10) - 1]}/${y.slice(2)}`
}

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthRange(ym: string): { start: string; end: string } {
  const [y, m] = ym.split('-').map(Number)
  const start = `${ym}-01`
  const end = new Date(y, m, 0).toISOString().split('T')[0]
  return { start, end }
}

function getCurrentMonthRangeInSaoPaulo() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)

  const year = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  const start = `${year}-${month}-01`
  const end = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]
  return { start, end, month: `${year}-${month}` }
}

async function getAuthenticatedContext(): Promise<AuthenticatedContext> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Nao autorizado')
  }

  return { supabase, user: { id: user.id, email: user.email ?? undefined } }
}

export async function getCoupleProfileServer(): Promise<CoupleProfile | null> {
  const { user } = await getAuthenticatedContext()

  const { data: couple, error } = await getActiveCoupleByUserId(user.id)
  if (error) throw error
  if (!couple) return null

  const partnerId = couple.user_id_1 === user.id ? couple.user_id_2 : couple.user_id_1
  const [{ data: partnerProfile }, { data: authUser }] = await Promise.all([
    getUserProfileById(partnerId),
    getAuthUserById(partnerId),
  ])

  const partner: UserProfile = {
    id: partnerId,
    name: partnerProfile?.name ?? authUser?.user?.email?.split('@')[0] ?? 'Parceiro',
    email: authUser?.user?.email ?? '',
    avatar_url: partnerProfile?.avatar_url ?? null,
    updated_at: partnerProfile?.updated_at ?? couple.created_at,
  }

  return { ...couple, partner }
}

export async function getNotificationsServer(params?: {
  unreadOnly?: boolean
  limit?: number
}): Promise<Notification[]> {
  const { supabase, user } = await getAuthenticatedContext()
  const unreadOnly = params?.unreadOnly ?? false
  const limit = Math.min(params?.limit ?? 20, 50)

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.is('read_at', null)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function getPendingInviteServer(): Promise<CoupleInvitation | null> {
  const { user } = await getAuthenticatedContext()
  const { data, error } = await getPendingInvitationByInviter(user.id)
  if (error) throw error
  return (data as CoupleInvitation | null) ?? null
}

export async function getReceivedInviteServer(): Promise<ReceivedCoupleInvite | null> {
  const { user } = await getAuthenticatedContext()
  const normalizedEmail = user.email?.trim().toLowerCase()
  const { data: invitations, error } = await getLatestReceivedPendingInvitation({
    userId: user.id,
    normalizedEmail,
  })

  if (error) throw error
  const invitation = invitations?.[0] as CoupleInvitation | undefined
  if (!invitation) return null

  const { data: inviterProfile } = await getUserProfileNameById(invitation.inviter_id)
  return {
    invitation,
    inviter_name: inviterProfile?.name ?? null,
  }
}

export async function getAccountsServer(userId?: string): Promise<Account[]> {
  const { supabase, user } = await getAuthenticatedContext()
  const targetUserId = userId ?? user.id

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return (data ?? []) as Account[]
}

export async function getTransactionsServer(params: {
  start?: string
  end?: string
  account_id?: string
  invoice_id?: string
  user_id?: string
  limit?: number
  offset?: number
}): Promise<Transaction[]> {
  const { supabase, user } = await getAuthenticatedContext()
  const limit = Math.min(params.limit ?? 100, 500)
  const offset = params.offset ?? 0
  const targetUserId = params.user_id ?? user.id

  let query = supabase
    .from('transactions')
    .select(`
      *,
      account:accounts!transactions_account_id_fkey(id, name, color, icon),
      category:categories(id, name, color, icon)
    `)
    .eq('user_id', targetUserId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.account_id) query = query.eq('account_id', params.account_id)
  if (params.invoice_id) query = query.eq('invoice_id', params.invoice_id)
  if (params.start) query = query.gte('date', params.start)
  if (params.end) query = query.lte('date', params.end)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Transaction[]
}

export async function getGoalsServer(scope: GoalScope = 'all'): Promise<Goal[]> {
  const { supabase, user } = await getAuthenticatedContext()

  let query = supabase
    .from('goals')
    .select(`
      *,
      contributions:goal_contributions(amount)
    `)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  if (scope === 'individual') {
    query = query.eq('user_id', user.id).is('couple_id', null)
  } else if (scope === 'couple') {
    query = query.not('couple_id', 'is', null)
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as Array<Goal & { contributions?: Array<{ amount: number }> }>).map((g) => ({
    ...g,
    current_amount: g.contributions?.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0,
    contributions: undefined,
  }))
}

export async function getProfileServer(): Promise<UserProfile> {
  const { supabase, user } = await getAuthenticatedContext()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('id, name, avatar_url')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error

  return {
    id: user.id,
    name: profile?.name ?? null,
    email: user.email ?? '',
    avatar_url: profile?.avatar_url ?? null,
  }
}

export async function getCardsOverviewServer(): Promise<CardOverviewItem[]> {
  const { supabase, user } = await getAuthenticatedContext()

  const { data: cards, error: cardsError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'credit')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (cardsError) throw cardsError

  const creditCards = (cards ?? []) as Account[]
  if (creditCards.length === 0) return []

  const cardIds = creditCards.map((card) => card.id)
  const { data: invoices, error: invoicesError } = await supabase
    .from('credit_invoices')
    .select('*')
    .eq('user_id', user.id)
    .in('account_id', cardIds)
    .in('status', ['open', 'closed'])
    .order('reference_month', { ascending: false })

  if (invoicesError) throw invoicesError

  const byCard = new Map<string, CardOverviewItem['summary']>()

  for (const invoice of (invoices ?? []) as CreditInvoice[]) {
    const acc = byCard.get(invoice.account_id) ?? {
      open_invoice: null,
      closed_invoice: null,
      used_amount: 0,
    }

    acc.used_amount += Number(invoice.total_amount)

    if (invoice.status === 'open' && !acc.open_invoice) acc.open_invoice = invoice
    if (invoice.status === 'closed' && !acc.closed_invoice) acc.closed_invoice = invoice

    byCard.set(invoice.account_id, acc)
  }

  return creditCards.map((card) => ({
    card,
    summary: byCard.get(card.id) ?? {
      open_invoice: null,
      closed_invoice: null,
      used_amount: 0,
    },
  }))
}

export async function getDashboardServer(): Promise<DashboardData> {
  const { supabase, user } = await getAuthenticatedContext()
  const { start, end } = getCurrentMonthRangeInSaoPaulo()

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
  const monthlyRows = (monthlyRes.data ?? []) as Array<{ income: number | string; expense: number | string }>
  const categoryRows = (categoryRes.data ?? []) as Array<{ category_name: string; category_color: string | null; total: number | string }>

  const accMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]))

  const total_balance = accounts
    .filter((a) => a.type !== 'credit')
    .reduce((s, a) => s + Number(a.balance), 0)

  const monthAgg = monthlyRows[0]
  const income_month = monthAgg ? Number(monthAgg.income) : 0
  const expense_month = monthAgg ? Number(monthAgg.expense) : 0

  const openByCard = new Map<string, number>()
  for (const inv of invoices) {
    const prev = openByCard.get(inv.account_id) ?? 0
    openByCard.set(inv.account_id, prev + Number(inv.total_amount))
  }

  const cards = accounts
    .filter((a) => a.type === 'credit' && a.credit_limit)
    .map((a) => {
      const open = openByCard.get(a.id) ?? 0
      const limit = Number(a.credit_limit)
      return {
        id: a.id,
        name: a.name,
        color: a.color,
        credit_limit: limit,
        open_invoice: open,
        available: limit - open,
        closing_day: a.closing_day ?? 0,
        due_day: a.due_day ?? 0,
      }
    })

  const recent_transactions = recentTxs.map((t) => {
    const category = Array.isArray(t.category) ? t.category[0] : t.category

    return {
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      date: t.date,
      category_name: category?.name ?? null,
      category_color: category?.color ?? null,
      account_name: accMap[t.account_id] ?? null,
    }
  })

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

  return {
    total_balance,
    income_month,
    expense_month,
    net_month: income_month - expense_month,
    cards,
    recent_transactions,
    top_categories,
    period: { start, end },
  }
}

export async function getReportsServer(month: string): Promise<ReportsPayload> {
  const { supabase, user } = await getAuthenticatedContext()
  const { start, end } = monthRange(month)

  const monthsBack = 5
  const monthList = Array.from({ length: monthsBack + 1 }, (_, i) => addMonths(month, -monthsBack + i))
  const monthlyStart = `${monthList[0]}-01`
  const daysInMonth = new Date(parseInt(month.split('-')[0], 10), parseInt(month.split('-')[1], 10), 0).getDate()

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

  const safeCategoryRows = (categoryRows ?? []) as Array<{
    category_id: string | null
    category_name: string
    category_color: string | null
    total: number | string
    tx_count: number | string
  }>
  const safeMonthlyRows = (monthlyRows ?? []) as Array<{ month: string; income: number | string; expense: number | string }>
  const safeDailyRows = (dailyRows ?? []) as Array<{ day: string; income: number | string; expense: number | string }>
  const safeCardRows = (cardRows ?? []) as Array<{
    account_id: string
    name: string
    color: string | null
    credit_limit: number | string
    used: number | string
  }>

  const totalExpenses = safeCategoryRows.reduce((sum, row) => sum + Number(row.total), 0)
  const categories = safeCategoryRows.map((row) => ({
    category_id: row.category_id,
    category_name: row.category_name,
    category_color: row.category_color,
    total: Number(row.total),
    count: Number(row.tx_count),
    percent: totalExpenses > 0 ? Math.round((Number(row.total) / totalExpenses) * 100) : 0,
  }))

  const monthlyMap = new Map(
    safeMonthlyRows.map((row) => [
      row.month,
      {
        income: Number(row.income),
        expense: Number(row.expense),
      },
    ]),
  )

  const monthlyData = monthList.map((ym) => {
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
    safeDailyRows.map((row) => [
      row.day,
      {
        income: Number(row.income),
        expense: Number(row.expense),
      },
    ]),
  )

  let runningBalance = 0
  const daily_flow = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, '0')
    const date = `${month}-${day}`
    const current = dailyMap.get(date) ?? { income: 0, expense: 0 }
    const inc = current.income
    const exp = current.expense
    runningBalance += inc - exp
    return { date, label: `${day}/${month.split('-')[1]}`, income: inc, expense: exp, balance: runningBalance }
  })

  const card_limits = safeCardRows.map((row) => {
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

  const past3 = Array.from({ length: 3 }, (_, i) => addMonths(month, -(i + 1)))
  const avgIncome = past3.reduce((sum, ym) => sum + (monthlyMap.get(ym)?.income ?? 0), 0) / 3
  const avgExpense = past3.reduce((sum, ym) => sum + (monthlyMap.get(ym)?.expense ?? 0), 0) / 3

  const { data: accs } = await supabase
    .from('accounts')
    .select('balance, type')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .neq('type', 'credit')

  const currentBalance = (accs ?? []).reduce((s, a) => s + Number(a.balance), 0)
  const currentMonthIncome = monthlyMap.get(month)?.income ?? 0
  const currentMonthExpense = monthlyMap.get(month)?.expense ?? 0

  let projBalance = currentBalance
  const projection = [
    {
      month,
      label: monthLabel(month),
      projected_income: currentMonthIncome,
      projected_expense: currentMonthExpense,
      projected_balance: currentBalance,
      is_projection: false,
    },
    ...Array.from({ length: 3 }, (_, i) => {
      const ym = addMonths(month, i + 1)
      projBalance += avgIncome - avgExpense
      return {
        month: ym,
        label: monthLabel(ym),
        projected_income: avgIncome,
        projected_expense: avgExpense,
        projected_balance: projBalance,
        is_projection: true,
      }
    }),
  ]

  return {
    categories,
    monthly: monthlyData,
    daily_flow,
    card_limits,
    projection,
    period: { start, end, month },
  }
}
