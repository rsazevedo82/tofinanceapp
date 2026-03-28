// app/(dashboard)/contas/page.tsx
'use client'

import { useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import dynamic            from 'next/dynamic'
import { useAccounts }    from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/utils/format'
import { Modal }          from '@/components/ui/Modal'
import { useCouple }      from '@/hooks/useCouple'
import { c }              from '@/lib/utils/copy'
import { EmptyStatePanel, LoadingStatePanel } from '@/components/ui/StatePanel'
import { Banknote, Building2, CreditCard, LineChart, PiggyBank } from 'lucide-react'
import type { Account }   from '@/types'

const AccountForm = dynamic(
  () => import('@/components/finance/AccountForm').then(m => m.AccountForm),
  { ssr: false }
)


export default function ContasPage() {
  const { data: couple }                   = useCouple()
  const isCouple                           = !!couple
  const { data: accounts = [], isLoading } = useAccounts()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState<Account | null>(null)

  // Saldo consolidado — apenas contas reais, sem cartões de crédito
  const otherAccounts = useMemo(
    () => accounts.filter(a => a.type !== 'credit'),
    [accounts]
  )
  const totalBalance = useMemo(
    () => otherAccounts.reduce((sum, a) => sum + Number(a.balance), 0),
    [otherAccounts]
  )

  function handleRowClick(account: Account) {
    setEditing(account)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8 md:mb-10">
        <div>
          <h1 className="page-title">Contas</h1>
          <p className="page-subtitle mt-1">
            {accounts.length} conta{accounts.length !== 1 ? 's' : ''} ativa{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary w-full sm:w-auto justify-center">
          <span className="text-lg leading-none">+</span>
          Nova conta
        </button>
      </div>

      {/* Saldo consolidado — apenas contas, sem cartao */}
      {otherAccounts.length > 0 && (
        <div className="card mb-6">
          <p className="label">Saldo total em contas</p>
          <p className="kpi-value text-[#0F172A]">
            {formatCurrency(totalBalance)}
          </p>
          <p className="meta-text mt-1">
            Poupança, corrente e carteiras (cartões não incluídos)
          </p>
        </div>
      )}

      {isLoading ? (
        <LoadingStatePanel rows={3} />
      ) : otherAccounts.length === 0 ? (
        <EmptyStatePanel
          icon={<Building2 size={26} className="text-[#475569]" aria-hidden />}
          title={c(isCouple, 'Você ainda não adicionou nenhuma conta', 'Vocês ainda não adicionaram nenhuma conta')}
          description={c(isCouple, 'Adicione sua primeira conta para começar', 'Adicionem a primeira conta de vocês')}
          action={(
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <span className="text-lg leading-none">+</span>
              Criar primeira conta
            </button>
          )}
        />
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
  const TYPE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
    checking: Building2,
    savings: PiggyBank,
    credit: CreditCard,
    investment: LineChart,
    wallet: Banknote,
  }

  const isCredit   = account.type === 'credit'
  const balanceVal = Number(account.balance)
  const Icon = TYPE_ICONS[account.type]

  return (
    <div
      onClick={onClick}
      className="db-row flex items-center justify-between px-2 py-3"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: account.color ? `${account.color}20` : 'rgba(15,23,42,0.05)' }}
        >
          {account.icon ? (
            <span>{account.icon}</span>
          ) : Icon ? (
            <Icon className="h-4 w-4 text-[#475569]" aria-hidden />
          ) : (
            <Building2 className="h-4 w-4 text-[#475569]" aria-hidden />
          )}
        </div>
        <div>
          <p className="entity-title">{account.name}</p>
          <div className="flex items-center gap-2">
            <p className="entity-meta">
              {account.type === 'checking' ? 'Conta corrente'
                : account.type === 'savings' ? 'Poupança'
                : account.type === 'credit'  ? 'Cartão de crédito'
                : account.type === 'investment' ? 'Investimento'
                : 'Carteira'}
            </p>
            {isCredit && account.credit_limit && (
              <p className="entity-meta">
                Limite: {formatCurrency(account.credit_limit)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {badge ? (
          <span className="text-xs px-2 py-0.5 rounded"
            style={{ color: '#FF7F50', background: 'rgba(255,127,80,0.1)' }}>
            {badge}
          </span>
        ) : (
          <span className={`text-sm font-semibold ${
            balanceVal >= 0 ? 'text-[#0F172A]' : 'text-[#C2410C]'
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

