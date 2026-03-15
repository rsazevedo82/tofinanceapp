import { createClient } from '@/lib/supabase/server'
import { TransactionList } from '@/components/finance/TransactionList'
import { NewTransactionButton } from '@/components/finance/NewTransactionButton'

export const dynamic = 'force-dynamic'

export default async function TransacoesPage() {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      account:accounts!transactions_account_id_fkey(id, name, color, icon),
      category:categories(id, name, color, icon)
    `)
    .is('deleted_at', null)
    .order('date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
	  <h1 className="text-2xl font-bold text-slate-100">Transações</h1>
	  <NewTransactionButton />
	</div>
      <div className="card">
        <TransactionList transactions={transactions ?? []} />
      </div>
    </div>
  )
}