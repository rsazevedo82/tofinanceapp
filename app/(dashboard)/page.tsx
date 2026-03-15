import { createClient } from '@/lib/supabase/server'
import { formatCurrency, getCurrentMonthRange } from '@/lib/utils/format'
import { TransactionList } from '@/components/finance/TransactionList'
import { NewTransactionButton } from '@/components/finance/NewTransactionButton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { start, end } = getCurrentMonthRange()

  const [accountsResult, transactionsResult] = await Promise.all([
    supabase.from('accounts').select('*').eq('is_active', true).is('deleted_at', null).order('name'),
    supabase.from('transactions').select(`
      *, account:accounts!transactions_account_id_fkey(id,name,color,icon),
      category:categories(id,name,color,icon)
    `).gte('date', start).lte('date', end).eq('status', 'confirmed')
      .is('deleted_at', null).order('date', { ascending: false }),
  ])

  const accounts = accountsResult.data ?? []
  const transactions = transactionsResult.data ?? []

  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = accounts.reduce((s, a) => s + Number(a.balance), 0)

  const month = new Date().toLocaleDateString('pt-BR', {
    month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo'
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight mb-1">
          Dashboard
        </h1>
        <p className="text-sm capitalize" style={{ color: 'rgba(200,198,190,0.35)' }}>
          {month}
        </p>
      </div>

      {/* Properties (estilo Notion) */}
      <div className="mb-8 space-y-0">
        {[
          { key: 'Conta',   val: accounts[0]?.name ?? 'Nenhuma conta' },
          { key: 'Período', val: `${start} → ${end}` },
          { key: 'Status',  val: '● Ativo', color: '#6ee7b7' },
        ].map(({ key, val, color }) => (
          <div key={key} className="flex items-center py-1.5 text-sm border-b border-white/[0.04]">
            <span className="w-28 flex-shrink-0 text-xs font-medium"
              style={{ color: 'rgba(200,198,190,0.35)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {key}
            </span>
            <span style={{ color: color ?? 'rgba(200,198,190,0.6)' }}>{val}</span>
          </div>
        ))}
      </div>

      <hr className="border-white/[0.06] mb-8" />

      {/* KPIs */}
      <p className="section-heading">Resumo do mês</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="card">
          <p className="label">Saldo total</p>
          <p className="text-xl font-semibold tracking-tight text-[#f0ede8]">
            {formatCurrency(balance)}
          </p>
        </div>
        <div className="card">
          <p className="label">Receitas</p>
          <p className="text-xl font-semibold tracking-tight" style={{ color: '#6ee7b7' }}>
            {formatCurrency(income)}
          </p>
        </div>
        <div className="card">
          <p className="label">Gastos</p>
          <p className="text-xl font-semibold tracking-tight" style={{ color: '#fca5a5' }}>
            {formatCurrency(expense)}
          </p>
        </div>
      </div>

      {/* Transações */}
      <div className="flex items-center justify-between mb-3">
        <p className="section-heading mb-0">Transações recentes</p>
        <NewTransactionButton />
      </div>

      {/* Database header estilo Notion */}
      <div className="grid gap-2 px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'rgba(200,198,190,0.3)', gridTemplateColumns: '1fr 100px 80px 90px' }}>
        <span>Nome</span>
        <span>Categoria</span>
        <span>Data</span>
        <span className="text-right">Valor</span>
      </div>
      <hr className="border-white/[0.05] mb-1" />

      <TransactionList transactions={transactions.slice(0, 8)} layout="database" />

    </div>
  )
}