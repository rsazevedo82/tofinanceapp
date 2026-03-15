'use client'

import { useState } from 'react'
import { useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import type { Transaction } from '@/types'

interface EditTransactionFormProps {
  transaction: Transaction
  onSuccess: () => void
  onDelete: () => void
}

export function EditTransactionForm({ transaction, onSuccess, onDelete }: EditTransactionFormProps) {
  const [error, setError]               = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: accounts   = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()

  const [form, setForm] = useState({
    type:        transaction.type as 'income' | 'expense',
    amount:      String(transaction.amount),
    description: transaction.description,
    date:        transaction.date,
    account_id:  transaction.account_id,
    category_id: transaction.category_id ?? '',
    notes:       transaction.notes ?? '',
  })

  const filteredCategories = categories.filter(c => c.type === form.type)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    updateTransaction.mutate(
      {
        id: transaction.id,
        body: {
          ...form,
          amount: parseFloat(form.amount),
          category_id: form.category_id || undefined,
        },
      },
      {
        onSuccess: () => onSuccess(),
        onError: (err) => setError(err.message),
      }
    )
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    deleteTransaction.mutate(transaction.id, {
      onSuccess: () => onDelete(),
      onError: (err) => setError(err.message),
    })
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
          type="number" step="0.01" min="0.01" className="input"
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label">Descrição</label>
        <input
          type="text" className="input"
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
        <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2.5 rounded-xl">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full py-3"
        disabled={updateTransaction.isPending}
      >
        {updateTransaction.isPending ? 'Salvando...' : 'Salvar alterações'}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleteTransaction.isPending}
        className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
          confirmDelete
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-transparent text-red-400 border border-red-500/30 hover:bg-red-500/10'
        }`}
      >
        {deleteTransaction.isPending
          ? 'Excluindo...'
          : confirmDelete
          ? 'Confirmar exclusão'
          : 'Excluir transação'}
      </button>

      {confirmDelete && (
        <button
          type="button"
          onClick={() => setConfirmDelete(false)}
          className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Cancelar exclusão
        </button>
      )}

    </form>
  )
}