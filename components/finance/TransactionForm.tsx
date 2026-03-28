// components/finance/TransactionForm.tsx
'use client'

import { useState, useEffect, useId }  from 'react'
import { useForm, Controller }           from 'react-hook-form'
import { zodResolver }                   from '@hookform/resolvers/zod'
import { z }                             from 'zod'
import { useAccounts }                   from '@/hooks/useAccounts'
import { useCategories }                 from '@/hooks/useCategories'
import { useQueryClient }                from '@tanstack/react-query'
import { useToast }                      from '@/components/providers/ToastProvider'
import { createTransactionSchema }       from '@/lib/validations/schemas'
import { useSubmitCtaState }             from '@/hooks/useSubmitCtaState'
import type { Transaction }              from '@/types'

// Omitimos installments do schema do form — é gerenciado como UI state separado
const transactionFormSchema = createTransactionSchema.omit({ installments: true })
type FormValues = z.infer<typeof transactionFormSchema>

interface TransactionFormProps {
  transaction?: Transaction
  onSuccess:    () => void
}

// ── Select acessivel ──────────────────────────────────────────────────────────

interface SelectOption { value: string; label: string }

function AccessibleSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled = false,
}: {
  id?: string
  value:        string
  onChange:     (v: string) => void
  options:      SelectOption[]
  placeholder?: string
  disabled?:    boolean
}) {
  const hasExplicitEmptyOption = options.some(opt => opt.value === '')
  const showPlaceholderOption = !hasExplicitEmptyOption

  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="input w-full min-h-[44px] h-11 text-sm"
    >
      {showPlaceholderOption ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map(opt => (
        <option key={opt.value || 'empty-option'} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// ── Formulario ────────────────────────────────────────────────────────────────

const INSTALLMENT_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const TYPE_CONFIG = {
  expense:  { label: '↓ Despesa',       bg: 'rgba(255,127,80,0.12)',  color: '#FF7F50', border: 'rgba(255,127,80,0.3)'  },
  income:   { label: '↑ Receita',       bg: 'rgba(45,212,191,0.12)',  color: '#2DD4BF', border: 'rgba(45,212,191,0.3)'  },
  transfer: { label: '⇄ Transferência', bg: 'rgba(107,114,128,0.1)',  color: '#334155', border: 'rgba(107,114,128,0.25)' },
}

export function TransactionForm({ transaction, onSuccess }: TransactionFormProps) {
  const idBase = useId()
  const amountId = `${idBase}-amount`
  const descriptionId = `${idBase}-description`
  const accountId = `${idBase}-account`
  const installmentsId = `${idBase}-installments`
  const customInstallmentsId = `${idBase}-installments-custom`
  const categoryId = `${idBase}-category`
  const dateId = `${idBase}-date`
  const statusId = `${idBase}-status`
  const notesId = `${idBase}-notes`

  const isEditing   = !!transaction
  const queryClient = useQueryClient()
  const { showToast } = useToast()

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
    resolver:      zodResolver(transactionFormSchema) as never,
    mode:          'onChange',
    reValidateMode:'onChange',
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
  const watchedDescription = watch('description') ?? ''
  const watchedDate = watch('date')

  const selectedAccount = accounts.find(a => a.id === watchedAccountId)
  const isCreditCard    = selectedAccount?.type === 'credit'
  const { isSaved } = useSubmitCtaState(isSubmitting)

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
        const message = 'Informe um número de parcelas entre 13 e 360.'
        setApiError(message)
        showToast({ title: 'Dados inválidos', description: message, variant: 'error' })
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
      showToast({ title: 'Não foi possível salvar', description: json.error, variant: 'error' })
      return
    }

    queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'active' })
    queryClient.invalidateQueries({ queryKey: ['transactions-infinite'], refetchType: 'active' })
    queryClient.invalidateQueries({ queryKey: ['accounts', 'me'], exact: true, refetchType: 'active' })
    queryClient.invalidateQueries({ queryKey: ['cards', 'overview'], exact: true, refetchType: 'active' })
    queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: true, refetchType: 'active' })
    showToast({
      title: isEditing ? 'Transação atualizada' : 'Transação criada',
      variant: 'success',
    })
    onSuccess()
  }

  const cfg          = TYPE_CONFIG[watchedType]

  return (
    <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-3">

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
                background: sel ? c.bg    : '#F3F4F6',
                color:      sel ? c.color : '#334155',
                border:     sel ? `1px solid ${c.border}` : '1px solid transparent',
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Valor */}
      <div>
        <label className="label" htmlFor={amountId}>Valor (R$)</label>
        <input
          id={amountId}
          {...register('amount', { setValueAs: (v) => v === '' ? undefined : parseFloat(v) })}
          type="number"
          step="0.01"
          min="0.01"
          className="input text-lg font-semibold"
          placeholder="0,00"
          style={{ color: cfg.color }}
          autoFocus={!isEditing}
        />
        {errors.amount ? (
          <p className="error-msg">{errors.amount.message}</p>
        ) : watchedAmount > 0 ? (
          <p className="mt-1 text-xs text-[#334155]">
            {cfg.label} de R$ {watchedAmount.toFixed(2)}
          </p>
        ) : (
          <p className="mt-1 text-xs text-[#334155]">Use até 2 casas decimais.</p>
        )}
      </div>

      {/* Descrição */}
      <div>
        <label className="label" htmlFor={descriptionId}>Descrição</label>
        <input
          id={descriptionId}
          {...register('description')}
          type="text"
          className="input"
          placeholder="Ex: Supermercado, Salário..."
        />
        {errors.description ? (
          <p className="error-msg">{errors.description.message}</p>
        ) : (
          <p className="mt-1 text-xs text-[#334155]">
            {watchedDescription.length}/255 caracteres
          </p>
        )}
      </div>

      {/* Conta */}
      <div>
        <label className="label" htmlFor={accountId}>Conta</label>
        <Controller
          name="account_id"
          control={control}
          render={({ field }) => (
            <AccessibleSelect
              id={accountId}
              value={field.value}
              onChange={field.onChange}
              options={accountOptions}
              placeholder="Selecione uma conta..."
            />
          )}
        />
        {errors.account_id ? (
          <p className="error-msg">{errors.account_id.message}</p>
        ) : (
          <p className="mt-1 text-xs text-[#334155]">
            Escolha a conta onde o valor será registrado.
          </p>
        )}
      </div>

      {/* Parcelas — somente cartao, despesa, criacao */}
      {isCreditCard && !isEditing && watchedType === 'expense' && (
        <div>
          <label className="label" htmlFor={installmentsId}>Parcelas</label>
          <AccessibleSelect
            id={installmentsId}
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
              id={customInstallmentsId}
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
          {useCustomInstallments && (parseInt(customInstallments) < 13 || parseInt(customInstallments) > 360) && customInstallments !== '' && (
            <p className="error-msg">Informe entre 13 e 360 parcelas.</p>
          )}
          {effectiveInstallments > 1 && watchedAmount > 0 && (
            <p className="mt-1 text-xs text-[#334155]">
              {effectiveInstallments}x de R$ {(watchedAmount / effectiveInstallments).toFixed(2)} · Total R$ {watchedAmount.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Categoria */}
      {watchedType !== 'transfer' && (
        <div>
          <label className="label" htmlFor={categoryId}>Categoria</label>
        <Controller
          name="category_id"
          control={control}
            render={({ field }) => (
              <AccessibleSelect
                id={categoryId}
                value={field.value ?? ''}
                onChange={field.onChange}
                options={categoryOptions}
                placeholder="Sem categoria"
            />
          )}
        />
        {errors.category_id && (
          <p className="error-msg">{errors.category_id.message}</p>
        )}
      </div>
      )}

      {/* Data */}
      <div>
        <label className="label" htmlFor={dateId}>Data</label>
        <input
          id={dateId}
          {...register('date')}
          type="date"
          className="input"
        />
        {errors.date ? (
          <p className="error-msg">{errors.date.message}</p>
        ) : watchedDate ? (
          <p className="mt-1 text-xs text-[#334155]">
            Data selecionada: {new Date(`${watchedDate}T12:00:00`).toLocaleDateString('pt-BR')}
          </p>
        ) : null}
      </div>

      {/* Campos secundarios — colapsaveis */}
      <button
        type="button"
        onClick={() => setShowExtras(v => !v)}
        data-active={showExtras}
        className="motion-tab w-full text-left text-xs py-1 flex items-center gap-1 text-[#334155]"
      >
        <span>{showExtras ? '▲' : '▼'}</span>
        {showExtras ? 'Menos opções' : 'Mais opções (status, observações)'}
      </button>

      <div className="motion-expand space-y-3 pt-1" data-open={showExtras}>
        <div>
          <label className="label" htmlFor={statusId}>Status</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <AccessibleSelect
                id={statusId}
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
          <label className="label" htmlFor={notesId}>Observações</label>
          <textarea
            id={notesId}
            {...register('notes')}
            className="input resize-none"
            rows={2}
            placeholder="Informações adicionais..."
          />
        </div>
      </div>

      {apiError && (
        <p className="motion-feedback alert-box alert-box-error">
          {apiError}
        </p>
      )}

      <button
        type="submit"
        className={`btn-primary w-full justify-center py-2.5 mt-1 ${isSaved ? 'motion-success' : ''}`}
        disabled={isSubmitting || isSaved}
      >
        {isSubmitting
          ? 'Salvando...'
          : isSaved
          ? 'Salvo com sucesso'
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

