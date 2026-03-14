import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export default async function ContasPage() {
  const supabase = await createClient()
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const typeLabels: Record<string, string> = {
    checking: 'Conta corrente',
    savings: 'Poupança',
    credit: 'Cartão de crédito',
    investment: 'Investimento',
    wallet: 'Carteira',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Contas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(accounts ?? []).map(account => (
          <div key={account.id} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: (account.color ?? '#6366f1') + '20' }}
              >
                🏦
              </div>
              <div>
                <p className="text-slate-100 font-medium">{account.name}</p>
                <p className="text-slate-500 text-xs">{typeLabels[account.type]}</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {formatCurrency(account.balance)}
            </p>
          </div>
        ))}

        {(accounts ?? []).length === 0 && (
          <p className="text-slate-500 text-sm col-span-3 text-center py-8">
            Nenhuma conta cadastrada ainda
          </p>
        )}
      </div>
    </div>
  )
}