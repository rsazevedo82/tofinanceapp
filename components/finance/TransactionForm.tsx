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

// ── Select customizado ────────────────────────────────────────────────────────

interface SelectOption { value: string; label: string }

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled = false,
}: {
  value:        string
  onChange:     (v: string) => void
  options:      SelectOption[]
  placeholder?: string
  disabled?:    boolean
}) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)
  const selected        = options.find(o => o.value === value)

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
        onClick={() => !disabled && setOpen(o => !o)}
        className="input w-full text-left flex items-center justify-between"
        style={{
          color:   selected ? '#e8e6e1' : 'rgba(200,198,190,0.35)',
          opacity: disabled ? 0.5 : 1,
          cursor:  disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        {!disabled && (
          <span className="text-[10px] opacity-40 ml-2 flex-shrink-0">{open ? '▲' : '▼'}</span>
        )}
      </button>

      {open && !disabled && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl shadow-xl"
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

// ── Formulario ────────────────────────────────────────────────────────────────

const INSTALLMENT_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const TYPE_CONFIG = {
  expense:  { label: '↓ Despesa',      bg: 'rgba(252,165,165,0.15)', color: '#fca5a5', border: 'rgba(252,165,165,0.3)' },
  income:   { label: '↑ Receita',      bg: 'rgba(110,231,183,0.15)', color: '#6ee7b7', border: 'rgba(110,231,183,0.3)' },
  transfer: { label: '⇄ Transferencia',bg: 'rgba(129,140,248,0.15)', color: '#818cf8', border: 'rgba(129,140,248,0.3)' },
}

export function TransactionForm({ transaction, onSuccess }: TransactionFormProps) {
  const isEditing   = !!transaction
  const queryClient = useQueryClient()

  const { data: accounts   = [] } = useAccounts()
  const { data: categories = [] } = useCategories()

  const [form, setForm] = useState({
    account_id:            transaction?.account_id            ?? '',
    category_id:           transaction?.category_id           ?? '',
    type:                  (transaction?.type ?? 'expense')   as 'income' | 'expense' | 'transfer',
    amount:                transaction?.amount?.toString()    ?? '',
    description:           transaction?.description           ?? '',
    notes:                 transaction?.notes                 ?? '',
    date:                  transaction?.date                  ?? new Date().toLocaleDateString('en-CA'),
    status:                transaction?.status                ?? 'confirmed',
    installments:          '1',
    customInstallments:    '',
    useCustomInstallments: false,
    showExtras:            false,   // campos secundarios colapsados por padrao
  })

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const selectedAccount = accounts.find(a => a.id === form.account_id)
  const isCreditCard    = selectedAccount?.type === 'credit'
  const amountValue     = parseFloat(form.amount) || 0

  const effectiveInstallments = form.useCustomInstallments
    ? parseInt(form.customInstallments) || 1
    : parseInt(form.installments)

  useEffect(() => {
    if (!isCreditCard) setForm(f => ({ ...f, installments: '1', useCustomInstallments: false }))
  }, [isCreditCard])

  const accountOptions: SelectOption[] = accounts.map(a => ({
    value: a.id,
    label: `${a.name}${a.type === 'credit' ? ' · Cartao' : ''}`,
  }))

  const filteredCategories = categories.filter(c =>
    form.type === 'transfer' ? true : c.type === form.type
  )
  const categoryOptions: SelectOption[] = [
    { value: '', label: 'Sem categoria' },
    ...filteredCategories.map(c => ({ value: c.id, label: c.name })),
  ]

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

  const cfg = TYPE_CONFIG[form.type]

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Tipo — sempre visivel, inclusive na edicao */}
      <div className="grid grid-cols-3 gap-1.5">
        {(['expense', 'income', 'transfer'] as const).map(t => {
          const c   = TYPE_CONFIG[t]
          const sel = form.type === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => setForm(f => ({ ...f, type: t, category_id: '' }))}
              className="py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: sel ? c.bg      : 'rgba(255,255,255,0.03)',
                color:      sel ? c.color   : 'rgba(200,198,190,0.4)',
                border:     sel ? `0.5px solid ${c.border}` : '0.5px solid rgba(255,255,255,0.06)',
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Valor — primeiro campo apos tipo */}
      <div>
        <label className="label">Valor (R$)</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          className="input text-lg font-semibold"
          placeholder="0,00"
          style={{ color: cfg.color }}
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          required
          autoFocus={!isEditing}
        />
      </div>

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
          {form.useCustomInstallments && (
            <input
              type="number"
              min="13"
              max="360"
              className="input mt-2"
              placeholder="Numero de parcelas (minimo 13)"
              value={form.customInstallments}
              onChange={e => setForm(f => ({ ...f, customInstallments: e.target.value }))}
              autoFocus
            />
          )}
          {effectiveInstallments > 1 && amountValue > 0 && (
            <p className="mt-1 text-[11px]" style={{ color: 'rgba(200,198,190,0.4)' }}>
              {effectiveInstallments}x de R$ {(amountValue / effectiveInstallments).toFixed(2)} · Total R$ {amountValue.toFixed(2)}
            </p>
          )}
        </div>
      )}

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

      {/* Campos secundarios — colapsaveis */}
      <button
        type="button"
        onClick={() => setForm(f => ({ ...f, showExtras: !f.showExtras }))}
        className="w-full text-left text-[11px] py-1 transition-colors flex items-center gap-1"
        style={{ color: 'rgba(200,198,190,0.35)' }}
      >
        <span>{form.showExtras ? '▲' : '▼'}</span>
        {form.showExtras ? 'Menos opcoes' : 'Mais opcoes (status, observacoes)'}
      </button>

      {form.showExtras && (
        <div className="space-y-3 pt-1">
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
          <div>
            <label className="label">Observacoes</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Informacoes adicionais..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full justify-center py-2.5 mt-1"
        disabled={loading}
        style={{
          background:  cfg.bg,
          color:       cfg.color,
          borderColor: cfg.border,
        }}
      >
        {loading
          ? 'Salvando...'
          : isEditing
          ? 'Salvar alteracoes'
          : effectiveInstallments > 1
          ? `Criar ${effectiveInstallments} parcelas`
          : form.type === 'income'
          ? 'Registrar receita'
          : form.type === 'transfer'
          ? 'Registrar transferencia'
          : 'Registrar despesa'}
      </button>
    </form>
  )
}