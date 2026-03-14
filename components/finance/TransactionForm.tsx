'use client'

import { useState, useEffect } from 'react'

import type { Account, Category } from '@/types'

export function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
  
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [accounts, setAccounts]   = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [form, setForm] = useState({
    type:        'expense' as 'income' | 'expense',
    amount:      '',
    description: '',
    date:        new Date().toISOString().split('T')[0],
    account_id:  '',
    category_id: '',
    notes:       '',
  })

  useEffect(() => {
    async function load() {
      const [accRes, catRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/categories'),
      ])
      const accData = await accRes.json()
      const catData = await catRes.json()
      if (accData.data) setAccounts(accData.data)
      if (catData.data) setCategories(catData.data)
    }
    load()
  }, [])

  const filteredCategories = categories.filter(c => c.type === form.type)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.category_id || undefined,
      }),
    })

    const json = await res.json()

	if (json.error) {
	  setError(json.error)
	  setLoading(false)
	  return
	}

	onSuccess()
	window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Tipo */}
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

      {/* Valor */}
      <div>
        <label className="label">Valor (R$)</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          className="input"
          placeholder="0,00"
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          required
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="label">Descrição</label>
        <input
          type="text"
          className="input"
          placeholder="Ex: Almoço, Salário..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          required
        />
      </div>

      {/* Conta */}
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

      {/* Categoria */}
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

      {/* Data */}
      <div>
        <label className="label">Data</label>
        <input
          type="date"
          className="input"
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
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Salvar transação'}
      </button>
    </form>
  )
}