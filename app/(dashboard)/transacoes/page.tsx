import { createClient } from '@/lib/supabase/server'
import { TransactionList } from '@/components/finance/TransactionList'
import { NewTransactionButton } from '@/components/finance/NewTransactionButton'
import { getCurrentMonthRange } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export default async function TransacoesPage() {
  const supabase = await createClient()
  const { start, end } = getCurrentMonthRange()

  const { data: transactions } = await supabase
    .from('transactions')
    .select(`*, account:accounts!transactions_account_id_fkey(id,name,color,icon), category:categories(id,name,color,icon)`)
    .gte('date', start).lte('date', end)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .limit(500)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Transações</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(200,198,190,0.35)' }}>
            {transactions?.length ?? 0} registros este mês
          </p>
        </div>
        <NewTransactionButton />
      </div>

      <div className="grid gap-2 px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'rgba(200,198,190,0.3)', gridTemplateColumns: '1fr 100px 80px 90px' }}>
        <span>Nome</span><span>Categoria</span><span>Data</span>
        <span className="text-right">Valor</span>
      </div>
      <hr className="border-white/[0.05] mb-1" />
      <TransactionList transactions={transactions ?? []} layout="database" />
    </div>
  )
}