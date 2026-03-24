// components/finance/TransactionForm.tsx
'use client'

import { useState, useEffect, useRef }  from 'react'
import { useForm, Controller }           from 'react-hook-form'
import { zodResolver }                   from '@hookform/resolvers/zod'
import { z }                             from 'zod'
import { useAccounts }                   from '@/hooks/useAccounts'
import { useCategories }                 from '@/hooks/useCategories'
import { useQueryClient }                from '@tanstack/react-query'
import { createTransactionSchema }       from '@/lib/validations/schemas'
import type { Transaction }              from '@/types'

// Omitimos installments do schema do form — é gerenciado como UI state separado
const transactionFormSchema = createTransactionSchema.omit({ installments: true })
type FormValues = z.infer<typeof transactionFormSchema>

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
  expense:  { label: '↓ Despesa',       bg: 'rgba(252,165,165,0.15)', color: '#fca5a5', border: 'rgba(252,165,165,0.3)' },
  income:   { label: '↑ Receita',       bg: 'rgba(110,231,183,0.15)', color: '#6ee7b7', border: 'rgba(110,231,183,0.3)' },
  transfer: { label: '⇄ Transferência', bg: 'rgba(129,140,248,0.15)', color: '#818cf8', border: 'rgba(129,140,248,0.3)' },
}

export function TransactionForm({ transaction, onSuccess }: TransactionFormProps) {
  const isEditing   = !!transaction
  const queryClient = useQueryClient()

  const { data: accounts   = [] } = useAccounts()
  const { data: categories = [] } = useCategories()

  // ── Estado de UI (fora do RHF) ───────────────────────────────────────────
  const [showExtras,            setShowExtras]            = useState(false)
  const [installments,          setInstallments]          = useState('1')
  const [customInstallments,    setCustomInstallments]    = useState('')
  const [useCustomInstallments, setUseCustomInstallments] = useState(false)
  const [apiError,              setApiError]              = useState('')

  // ── React Hook Form ───────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver:      zodResolver(transactionFormSchema),
    defaultValues: {
      account_id:  transaction?.account_id  ?? '',
      category_id: transaction?.category_id ?? '',
      type:        transaction?.type        ?? 'expense',
      amount:      transaction?.amount      ?? undefined,
      description: transaction?.description ?? '',
      notes:       transaction?.notes       ?? '',
      date:        transaction?.date        ?? new Date().toLocaleDateString('en-CA'),
      status:      transaction?.status      ?? 'confirmed',
    },
  })

  const watchedType      = watch('type')
  const watchedAccountId = watch('account_id')
  const watchedAmount    = watch('amount') ?? 0

  const selectedAccount = accounts.find(a => a.id === watchedAccountId)
  const isCreditCard    = selectedAccount?.type === 'credit'

  useEffect(() => {
    if (!isCreditCard) {
      setInstallments('1')
      setUseCustomInstallments(false)
    }
  }, [isCreditCard])

  const effectiveInstallments = useCustomInstallments
    ? parseInt(customInstallments) || 1
    : parseInt(installments)

  const accountOptions: SelectOption[] = accounts.map(a => ({
    value: a.id,
    label: `${a.name}${a.type === 'credit' ? ' · Cartao' : ''}`,
  }))

  const filteredCategories = categories.filter(c =>
    watchedType === 'transfer' ? true : c.type === watchedType
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
        : `${n}x${watchedAmount > 0 ? ` de R$ ${(watchedAmount / n).toFixed(2)}` : ''}`,
    })),
    { value: 'custom', label: 'Personalizado...' },
  ]

  async function onSubmit(data: FormValues) {
    setApiError('')

    if (useCustomInstallments) {
      const n = parseInt(customInstallments)
      if (isNaN(n) || n < 13 || n > 360) {
        setApiError('Informe um número de parcelas entre 13 e 360.')
        return
      }
    }

    const body: Record<string, unknown> = {
      account_id:   data.account_id,
      type:         data.type,
      amount:       data.amount,
      description:  data.description,
      date:         data.date,
      status:       data.status,
      installments: effectiveInstallments,
    }
    if (data.category_id) body.category_id = data.category_id
    if (data.notes?.trim()) body.notes = data.notes

    const url    = isEditing ? `/api/transactions/${transaction.id}` : '/api/transactions'
    const method = isEditing ? 'PATCH' : 'POST'

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const json = await res.json()

    if (json.error) {
      setApiError(json.error)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    onSuccess()
  }

  const cfg          = TYPE_CONFIG[watchedType]
  const displayError = Object.values(errors)[0]?.message ?? apiError

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

      {/* Tipo */}
      <div className="grid grid-cols-3 gap-1.5">
        {(['expense', 'income', 'transfer'] as const).map(t => {
          const c   = TYPE_CONFIG[t]
          const sel = watchedType === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => { setValue('type', t); setValue('category_id', '') }}
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

      {/* Valor */}
      <div>
        <label className="label">Valor (R$)</label>
        <input
          {...register('amount', { setValueAs: (v) => v === '' ? undefined : parseFloat(v) })}
          type="number"
          step="0.01"
          min="0.01"
          className="input text-lg font-semibold"
          placeholder="0,00"
          style={{ color: cfg.color }}
          autoFocus={!isEditing}
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="label">Descrição</label>
        <input
          {...register('description')}
          type="text"
          className="input"
          placeholder="Ex: Supermercado, Salário..."
        />
      </div>

      {/* Conta */}
      <div>
        <label className="label">Conta</label>
        <Controller
          name="account_id"
          control={control}
          render={({ field }) => (
            <CustomSelect
              value={field.value}
              onChange={field.onChange}
              options={accountOptions}
              placeholder="Selecione uma conta..."
            />
          )}
        />
      </div>

      {/* Parcelas — somente cartao, despesa, criacao */}
      {isCreditCard && !isEditing && watchedType === 'expense' && (
        <div>
          <label className="label">Parcelas</label>
          <CustomSelect
            value={useCustomInstallments ? 'custom' : installments}
            onChange={v => {
              if (v === 'custom') {
                setUseCustomInstallments(true)
                setCustomInstallments('')
              } else {
                setUseCustomInstallments(false)
                setInstallments(v)
              }
            }}
            options={installmentOptions}
          />
          {useCustomInstallments && (
            <input
              type="number"
              min="13"
              max="360"
              className="input mt-2"
              placeholder="Número de parcelas (mínimo 13)"
              value={customInstallments}
              onChange={e => setCustomInstallments(e.target.value)}
              autoFocus
            />
          )}
          {effectiveInstallments > 1 && watchedAmount > 0 && (
            <p className="mt-1 text-[11px]" style={{ color: 'rgba(200,198,190,0.4)' }}>
              {effectiveInstallments}x de R$ {(watchedAmount / effectiveInstallments).toFixed(2)} · Total R$ {watchedAmount.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Categoria */}
      {watchedType !== 'transfer' && (
        <div>
          <label className="label">Categoria</label>
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <CustomSelect
                value={field.value ?? ''}
                onChange={field.onChange}
                options={categoryOptions}
                placeholder="Sem categoria"
              />
            )}
          />
        </div>
      )}

      {/* Data */}
      <div>
        <label className="label">Data</label>
        <input
          {...register('date')}
          type="date"
          className="input"
        />
      </div>

      {/* Campos secundarios — colapsaveis */}
      <button
        type="button"
        onClick={() => setShowExtras(v => !v)}
        className="w-full text-left text-[11px] py-1 transition-colors flex items-center gap-1"
        style={{ color: 'rgba(200,198,190,0.35)' }}
      >
        <span>{showExtras ? '▲' : '▼'}</span>
        {showExtras ? 'Menos opções' : 'Mais opções (status, observações)'}
      </button>

      {showExtras && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="label">Status</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'confirmed', label: 'Confirmado' },
                    { value: 'pending',   label: 'Pendente'   },
                  ]}
                />
              )}
            />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea
              {...register('notes')}
              className="input resize-none"
              rows={2}
              placeholder="Informações adicionais..."
            />
          </div>
        </div>
      )}

      {displayError && (
        <p className="text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
          {displayError}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full justify-center py-2.5 mt-1"
        disabled={isSubmitting}
        style={{
          background:  cfg.bg,
          color:       cfg.color,
          borderColor: cfg.border,
        }}
      >
        {isSubmitting
          ? 'Salvando...'
          : isEditing
          ? 'Salvar alterações'
          : effectiveInstallments > 1
          ? `Criar ${effectiveInstallments} parcelas`
          : watchedType === 'income'
          ? 'Registrar receita'
          : watchedType === 'transfer'
          ? 'Registrar transferência'
          : 'Registrar despesa'}
      </button>
    </form>
  )
}
