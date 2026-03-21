// components/finance/TransactionForm.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccounts }                  from '@/hooks/useAccounts'
import { useCategories }                from '@/hooks/useCategories'
import { useQueryClient }               from '@tanstack/react-query'
import type { Transaction }             from '@/types'

interface TransactionFormProps {
  transaction?: Transaction
  onSuccess:    () => void
}

// ── Select customizado (resolve problema de contraste no dropdown nativo) ─────

interface SelectOption { value: string; label: string }

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
}: {
  value:       string
  onChange:    (v: string) => void
  options:     SelectOption[]
  placeholder?: string
}) {
  const [open, setOpen]   = useState(false)
  const ref               = useRef<HTMLDivElement>(null)
  const selected          = options.find(o => o.value === value)

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input w-full text-left flex items-center justify-between"
        style={{ color: selected ? '#e8e6e1' : 'rgba(200,198,190,0.35)' }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span className="text-[10px] opacity-40 ml-2">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
          style={{
            background: '#1c1c1a',
            border:     '0.5px solid rgba(255,255,255,0.1)',
            maxHeight:  '220px',
            overflowY:  'auto',
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{
                color:      opt.value === value ? '#e8e6e1' : '#9ca3af',
                background: opt.value === value ? 'rgba(255,255,255,0.06)' : 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = opt.value === value ? 'rgba(255,255,255,0.06)' : 'transparent')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Formulario principal ──────────────────────────────────────────────────────

const INSTALLMENT_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export function TransactionForm({ transaction, onSuccess }: TransactionFormProps) {
  const isEditing   = !!transaction
  const queryClient = useQueryClient()

  const { data: accounts   = [] } = useAccounts()
  const { data: categories = [] } = useCategories()

  const [form, setForm] = useState({
    account_id:  transaction?.account_id  ?? '',
    category_id: transaction?.category_id ?? '',
    type:        (transaction?.type ?? 'expense') as 'income' | 'expense' | 'transfer',
    amount:      transaction?.amount?.toString() ?? '',
    description: transaction?.description ?? '',
    notes:       transaction?.notes       ?? '',
    date:        transaction?.date        ?? new Date().toLocaleDateString('en-CA'),
    status:      transaction?.status      ?? 'confirmed',
    installments: '1',
    customInstallments: '',
    useCustomInstallments: false,
  })

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const selectedAccount = accounts.find(a => a.id === form.account_id)
  const isCreditCard    = selectedAccount?.type === 'credit'

  const effectiveInstallments = form.useCustomInstallments
    ? parseInt(form.customInstallments) || 1
    : parseInt(form.installments)

  const amountValue = parseFloat(form.amount) || 0

  useEffect(() => {
    if (!isCreditCard) setForm(f => ({ ...f, installments: '1', useCustomInstallments: false }))
  }, [isCreditCard])

  // Opcoes de conta para CustomSelect
  const accountOptions: SelectOption[] = accounts.map(a => ({
    value: a.id,
    label: `${a.name}${a.type === 'credit' ? ' (Cartao)' : ''}`,
  }))

  // Opcoes de categoria
  const filteredCategories = categories.filter(c =>
    form.type === 'transfer' ? true : c.type === form.type
  )
  const categoryOptions: SelectOption[] = [
    { value: '', label: 'Sem categoria' },
    ...filteredCategories.map(c => ({ value: c.id, label: c.name })),
  ]

  // Opcoes de parcelas
  const installmentOptions: SelectOption[] = [
    ...INSTALLMENT_PRESETS.map(n => ({
      value: String(n),
      label: n === 1
        ? 'A vista'
        : `${n}x${amountValue > 0 ? ` de R$ ${(amountValue / n).toFixed(2)}` : ''}`,
    })),
    { value: 'custom', label: 'Personalizado...' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.useCustomInstallments) {
      const n = parseInt(form.customInstallments)
      if (isNaN(n) || n < 13 || n > 360) {
        setError('Informe um numero de parcelas entre 13 e 360.')
        return
      }
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        account_id:   form.account_id,
        type:         form.type,
        amount:       amountValue,
        description:  form.description,
        date:         form.date,
        status:       form.status,
        installments: effectiveInstallments,
      }
      if (form.category_id) body.category_id = form.category_id
      if (form.notes.trim()) body.notes       = form.notes

      const url    = isEditing ? `/api/transactions/${transaction.id}` : '/api/transactions'
      const method = isEditing ? 'PATCH' : 'POST'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)

      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Tipo */}
      {!isEditing && (
        <div className="grid grid-cols-3 gap-2">
          {(['expense', 'income', 'transfer'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setForm(f => ({ ...f, type: t, category_id: '' }))}
              className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                form.type === t
                  ? t === 'income'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : t === 'expense'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800 text-slate-400 border border-transparent'
              }`}
            >
              {t === 'income' ? '↑ Receita' : t === 'expense' ? '↓ Despesa' : '⇄ Transf.'}
            </button>
          ))}
        </div>
      )}

      {/* Conta */}
      <div>
        <label className="label">Conta</label>
        <CustomSelect
          value={form.account_id}
          onChange={v => setForm(f => ({ ...f, account_id: v }))}
          options={accountOptions}
          placeholder="Selecione uma conta..."
        />
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

      {/* Parcelas — somente cartao, despesa, criacao */}
      {isCreditCard && !isEditing && form.type === 'expense' && (
        <div>
          <label className="label">Parcelas</label>
          <CustomSelect
            value={form.useCustomInstallments ? 'custom' : form.installments}
            onChange={v => {
              if (v === 'custom') {
                setForm(f => ({ ...f, useCustomInstallments: true, customInstallments: '' }))
              } else {
                setForm(f => ({ ...f, useCustomInstallments: false, installments: v }))
              }
            }}
            options={installmentOptions}
          />

          {/* Input customizado */}
          {form.useCustomInstallments && (
            <div className="mt-2">
              <input
                type="number"
                min="13"
                max="360"
                className="input"
                placeholder="Numero de parcelas (minimo 13)"
                value={form.customInstallments}
                onChange={e => setForm(f => ({ ...f, customInstallments: e.target.value }))}
                autoFocus
              />
            </div>
          )}

          {/* Resumo */}
          {effectiveInstallments > 1 && amountValue > 0 && (
            <p className="mt-1.5 text-[11px]" style={{ color: 'rgba(200,198,190,0.4)' }}>
              Total R$ {amountValue.toFixed(2)} em {effectiveInstallments}x de R$ {(amountValue / effectiveInstallments).toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Descricao */}
      <div>
        <label className="label">Descricao</label>
        <input
          type="text"
          className="input"
          placeholder="Ex: Supermercado, Salario..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          required
        />
      </div>

      {/* Categoria */}
      {form.type !== 'transfer' && (
        <div>
          <label className="label">Categoria</label>
          <CustomSelect
            value={form.category_id}
            onChange={v => setForm(f => ({ ...f, category_id: v }))}
            options={categoryOptions}
            placeholder="Sem categoria"
          />
        </div>
      )}

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

      {/* Status */}
      <div>
        <label className="label">Status</label>
        <CustomSelect
          value={form.status}
          onChange={v => setForm(f => ({ ...f, status: v }))}
          options={[
            { value: 'confirmed', label: 'Confirmado' },
            { value: 'pending',   label: 'Pendente'   },
          ]}
        />
      </div>

      {/* Observacoes */}
      <div>
        <label className="label">Observacoes (opcional)</label>
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="Informacoes adicionais..."
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
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
        disabled={loading}
      >
        {loading
          ? 'Salvando...'
          : isEditing
          ? 'Salvar alteracoes'
          : effectiveInstallments > 1
          ? `Criar ${effectiveInstallments} parcelas`
          : 'Criar transacao'}
      </button>
    </form>
  )
}