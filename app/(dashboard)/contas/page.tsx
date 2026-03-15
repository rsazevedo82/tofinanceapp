import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

const typeLabels: Record<string, string> = {
  checking: 'Conta corrente', savings: 'Poupança',
  credit: 'Cartão de crédito', investment: 'Investimento', wallet: 'Carteira',
}

export default async function ContasPage() {
  const supabase = await createClient()
  const { data: accounts } = await supabase
    .from('accounts').select('*').eq('is_active', true)
    .is('deleted_at', null).order('name')

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Contas</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(200,198,190,0.35)' }}>
          {accounts?.length ?? 0} contas ativas
        </p>
      </div>

      <p className="section-heading">Suas contas</p>

      {(accounts ?? []).length === 0 ? (
        <p className="text-sm py-12 text-center" style={{ color: 'rgba(200,198,190,0.3)' }}>
          Nenhuma conta cadastrada
        </p>
      ) : (
        <div className="space-y-0.5">
          {(accounts ?? []).map(account => (
            <div key={account.id} className="db-row flex items-center justify-between px-2 py-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>◫</div>
                <div>
                  <p className="text-sm font-medium text-[#e8e6e1]">{account.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(200,198,190,0.35)' }}>
                    {typeLabels[account.type]}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-[#f0ede8]">
                {formatCurrency(account.balance)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}