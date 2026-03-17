'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'

export function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState('')
  const router = useRouter()

  const { data: accounts   = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const createTransaction = useCreateTransaction()

  const [form, setForm] = useState({
    type:        'expense' as 'income' | 'expense',
    amount:      '',
    description: '',
    date:        new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }),
    account_id:  '',
    category_id: '',
    notes:       '',
  })

  const filteredCategories = categories.filter(c => c.type === form.type)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    createTransaction.mutate(
      {
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.category_id || undefined,
      },
      {
        onSuccess: () => {
          onSuccess()
          router.refresh() // revalida Server Components sem reload completo
        },
        onError: (err) => setError(err.message),
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="grid grid-cols-2 gap-2">
        {(['expense', 'income'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setForm(f => ({ ...f, type, category_id: '' }))}
            className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
              form.type === type
                ? type === 'income'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-slate-800 text-slate-400 border border-transparent'
            }`}
          >
            {type === 'income' ? '↑ Receita' : '↓ Despesa'}
          </button>
        ))}
      </div>

      <div>
        <label className="label">Valor (R$)</label>
        <input
          type="number" step="0.01" min="0.01" className="input" placeholder="0,00"
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label">Descrição</label>
        <input
          type="text" className="input" placeholder="Ex: Almoço, Salário..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label">Conta</label>
        <select
          className="input"
          value={form.account_id}
          onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
          required
        >
          <option value="">Selecione uma conta</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Categoria</label>
        <select
          className="input"
          value={form.category_id}
          onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
        >
          <option value="">Sem categoria</option>
          {filteredCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Data</label>
        <input
          type="date" className="input"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          required
        />
      </div>

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full justify-center py-2.5"
        disabled={createTransaction.isPending}
      >
        {createTransaction.isPending ? 'Salvando...' : 'Salvar transação'}
      </button>

    </form>
  )
}