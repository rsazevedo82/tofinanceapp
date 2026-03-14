import { createClient } from '@/lib/supabase/server'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils/format'
import { TransactionList } from '@/components/finance/TransactionList'
import { ExpensesChart } from '@/components/finance/ExpensesChart'
import { NewTransactionButton } from '@/components/finance/NewTransactionButton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { start, end } = getCurrentMonthRange()

  const [accountsResult, transactionsResult] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('transactions')
	.select(`
	  *,
	  account:accounts!transactions_account_id_fkey(id, name, color, icon),
	  category:categories(id, name, color, icon)
	`)
      .gte('date', start)
      .lte('date', end)
      .eq('status', 'confirmed')
      .order('date', { ascending: false }),
  ])

  const accounts = accountsResult.data ?? []
  const transactions = transactionsResult.data ?? []

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalBalance = accounts
    .reduce((sum, a) => sum + Number(a.balance), 0)

  const categoryMap = new Map<string, {
    category_id: string
    category_name: string
    category_color: string | null
    total: number
  }>()

  transactions
    .filter(t => t.type === 'expense' && t.category)
    .forEach(t => {
      const cat = t.category
      const prev = categoryMap.get(cat.id)
      if (prev) {
        prev.total += Number(t.amount)
      } else {
        categoryMap.set(cat.id, {
          category_id: cat.id,
          category_name: cat.name,
          category_color: cat.color,
          total: Number(t.amount),
        })
      }
    })

  const expensesByCategory = Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)

  const month = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })

  return (
    <div className="space-y-8">

{/* Header */}
	<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
	  <div>
	    <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
	    <p className="text-slate-500 text-sm mt-1 capitalize">{month}</p>
	  </div>
	  <NewTransactionButton />
	</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-slate-500 text-sm mb-1">Saldo total</p>
          <p className="text-2xl font-bold text-slate-100">
            {formatCurrency(totalBalance)}
          </p>
        </div>
        <div className="card border-green-500/20">
          <p className="text-slate-500 text-sm mb-1">Receitas do mês</p>
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(income)}
          </p>
        </div>
        <div className="card border-red-500/20">
          <p className="text-slate-500 text-sm mb-1">Gastos do mês</p>
          <p className="text-2xl font-bold text-red-400">
            {formatCurrency(expense)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-slate-100 font-semibold mb-4">Transações recentes</h2>
          <TransactionList transactions={transactions.slice(0, 5)} />
        </div>
        <div className="card">
          <h2 className="text-slate-100 font-semibold mb-4">Gastos por categoria</h2>
          <ExpensesChart data={expensesByCategory} />
        </div>
      </div>

    </div>
  )
}