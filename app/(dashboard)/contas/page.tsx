// app/(dashboard)/contas/page.tsx
'use client'

import { useState }       from 'react'
import { useAccounts }    from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/utils/format'
import { Modal }          from '@/components/ui/Modal'
import { AccountForm }    from '@/components/finance/AccountForm'
import { useCouple }      from '@/hooks/useCouple'
import { c }              from '@/lib/utils/copy'
import type { Account }   from '@/types'


export default function ContasPage() {
  const { data: couple }                   = useCouple()
  const isCouple                           = !!couple
  const { data: accounts = [], isLoading } = useAccounts()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState<Account | null>(null)

  // Saldo consolidado — apenas contas reais, sem cartões de crédito
  const otherAccounts = accounts.filter(a => a.type !== 'credit')
  const totalBalance  = otherAccounts.reduce((sum, a) => sum + Number(a.balance), 0)

  function handleRowClick(account: Account) {
    setEditing(account)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Contas</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {accounts.length} conta{accounts.length !== 1 ? 's' : ''} ativa{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">
          <span className="opacity-60">+</span>
          Nova conta
        </button>
      </div>

      {/* Saldo consolidado — apenas contas, sem cartao */}
      {otherAccounts.length > 0 && (
        <div className="card mb-6">
          <p className="label">Saldo total em contas</p>
          <p className="text-2xl font-semibold tracking-tight text-[#f0ede8]">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Poupança, corrente e carteiras (cartões não incluídos)
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-0.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="db-row px-2 py-3 animate-pulse">
              <div className="w-7 h-7 rounded-md bg-white/5" />
              <div className="ml-3 flex-1 space-y-1.5">
                <div className="h-3 bg-white/5 rounded w-32" />
                <div className="h-2 bg-white/5 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : otherAccounts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-4">🏦</p>
          <p className="text-sm font-medium text-[#e8e6e1] mb-1">
            {c(isCouple, 'Você ainda não adicionou nenhuma conta', 'Vocês ainda não adicionaram nenhuma conta')}
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
            {c(isCouple, 'Adicione sua primeira conta para começar', 'Adicionem a primeira conta de vocês')}
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs mx-auto">
            <span className="opacity-60">+</span>
            Criar primeira conta
          </button>
        </div>
      ) : (
        <div>
          <p className="section-heading">{c(isCouple, 'Suas contas', 'Contas de vocês')}</p>
          <div className="space-y-0.5">
            {otherAccounts.map(account => (
              <AccountRow
                key={account.id}
                account={account}
                onClick={() => handleRowClick(account)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal criacao — apenas contas (nao-cartao) */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nova conta">
        <AccountForm
          allowedTypes={['checking', 'savings', 'investment', 'wallet']}
          onSuccess={() => setShowCreate(false)}
        />
      </Modal>

      {/* Modal edicao — apenas para nao-cartao */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar conta">
        {editing && (
          <AccountForm
            account={editing}
            allowedTypes={['checking', 'savings', 'investment', 'wallet']}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}

// ── Componente de linha ───────────────────────────────────────────────────────

function AccountRow({
  account,
  onClick,
  badge,
}: {
  account: Account
  onClick: () => void
  badge?: string
}) {
  const TYPE_ICONS: Record<string, string> = {
    checking: '🏦', savings: '🐷', credit: '💳', investment: '📈', wallet: '👛',
  }

  const isCredit   = account.type === 'credit'
  const balanceVal = Number(account.balance)

  return (
    <div
      onClick={onClick}
      className="db-row flex items-center justify-between px-2 py-3"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: account.color ? `${account.color}20` : 'rgba(255,255,255,0.06)' }}
        >
          {account.icon ?? TYPE_ICONS[account.type] ?? '◫'}
        </div>
        <div>
          <p className="text-sm font-medium text-[#e8e6e1]">{account.name}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {account.type === 'checking' ? 'Conta corrente'
                : account.type === 'savings' ? 'Poupança'
                : account.type === 'credit'  ? 'Cartão de crédito'
                : account.type === 'investment' ? 'Investimento'
                : 'Carteira'}
            </p>
            {isCredit && account.credit_limit && (
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Limite: {formatCurrency(account.credit_limit)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {badge ? (
          <span className="text-[10px] px-2 py-0.5 rounded"
            style={{ color: 'rgba(129,140,248,0.8)', background: 'rgba(129,140,248,0.08)' }}>
            {badge}
          </span>
        ) : (
          <span className={`text-sm font-semibold ${
            balanceVal >= 0 ? 'text-[#f0ede8]' : 'text-[#fca5a5]'
          }`}>
            {formatCurrency(balanceVal)}
          </span>
        )}
        {account.color && (
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: account.color }} />
        )}
      </div>
    </div>
  )
}