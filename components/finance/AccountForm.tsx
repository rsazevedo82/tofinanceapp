// components/finance/AccountForm.tsx
'use client'

import { useForm }                                                    from 'react-hook-form'
import { zodResolver }                                                from '@hookform/resolvers/zod'
import { z }                                                          from 'zod'
import { useState }                                                   from 'react'
import { useRouter }                                                  from 'next/navigation'
import { useCreateAccount, useUpdateAccount, useDeleteAccount }       from '@/hooks/useAccounts'
import { createAccountSchema }                                        from '@/lib/validations/schemas'
import type { Account }                                               from '@/types'

type FormValues = z.infer<typeof createAccountSchema>

const COLOR_PRESETS = [
  '#6ee7b7', '#34d399', '#60a5fa', '#818cf8',
  '#f472b6', '#fb923c', '#fbbf24', '#a78bfa',
  '#94a3b8', '#f87171',
]

const ACCOUNT_TYPES = [
  { value: 'checking',   label: 'Conta corrente'   },
  { value: 'savings',    label: 'Poupança'          },
  { value: 'credit',     label: 'Cartão de crédito' },
  { value: 'investment', label: 'Investimento'      },
  { value: 'wallet',     label: 'Carteira'          },
] as const

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

type AccountTypeValue = typeof ACCOUNT_TYPES[number]['value']

interface AccountFormProps {
  account?:     Account
  allowedTypes?: AccountTypeValue[]
  onSuccess:    () => void
}

export function AccountForm({ account, allowedTypes, onSuccess }: AccountFormProps) {
  const isEditing = !!account
  const router    = useRouter()

  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [apiError,      setApiError]      = useState('')

  const availableTypes = allowedTypes
    ? ACCOUNT_TYPES.filter(t => allowedTypes.includes(t.value))
    : ACCOUNT_TYPES

  const defaultType = account?.type ?? availableTypes[0]?.value ?? 'checking'

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver:      zodResolver(createAccountSchema),
    defaultValues: {
      name:         account?.name        ?? '',
      type:         defaultType,
      color:        account?.color       ?? '#6ee7b7',
      credit_limit: account?.credit_limit ?? undefined,
      closing_day:  account?.closing_day  ?? 25,
      due_day:      account?.due_day      ?? 5,
    },
  })

  const currentType  = watch('type')
  const currentColor = watch('color')
  const isCreditCard = currentType === 'credit'

  function onSubmit(data: FormValues) {
    setApiError('')

    const body: Record<string, unknown> = {
      name:  data.name,
      type:  data.type,
      color: data.color,
    }

    if (isCreditCard) {
      body.credit_limit = data.credit_limit
      body.closing_day  = data.closing_day
      body.due_day      = data.due_day
    }

    if (isEditing) {
      updateAccount.mutate(
        { id: account.id, body },
        {
          onSuccess: () => { onSuccess(); router.refresh() },
          onError:   (err) => setApiError(err.message),
        }
      )
    } else {
      if (data.initial_balance) body.initial_balance = data.initial_balance
      createAccount.mutate(body, {
        onSuccess: () => { onSuccess(); router.refresh() },
        onError:   (err) => setApiError(err.message),
      })
    }
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteAccount.mutate({ id: account!.id }, {
      onSuccess: () => { onSuccess(); router.refresh() },
      onError:   (err) => setApiError(err.message),
    })
  }

  const isPending    = createAccount.isPending || updateAccount.isPending
  const displayError = Object.values(errors)[0]?.message ?? apiError

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Nome */}
      <div>
        <label className="label">Nome da conta</label>
        <input
          {...register('name')}
          type="text"
          className="input"
          placeholder="Ex: Nubank, Itau, Carteira..."
        />
      </div>

      {/* Tipo — oculto quando só há uma opção disponível */}
      {availableTypes.length > 1 && (
        <div>
          <label className="label">Tipo</label>
          <select {...register('type')} className="input">
            {availableTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Campos especificos de cartao */}
      {isCreditCard && (
        <div className="space-y-3 p-3 rounded-xl"
          style={{ background: 'rgba(129,140,248,0.06)', border: '0.5px solid rgba(129,140,248,0.2)' }}>

          <p className="text-xs font-medium" style={{ color: '#818cf8' }}>
            Configurações do cartão
          </p>

          <div>
            <label className="label">Limite total (R$)</label>
            <input
              {...register('credit_limit', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="Ex: 5000,00"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dia de fechamento</label>
              <select
                {...register('closing_day', { setValueAs: (v) => parseInt(v) })}
                className="input"
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Dia de vencimento</label>
              <select
                {...register('due_day', { setValueAs: (v) => parseInt(v) })}
                className="input"
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Saldo inicial - somente criacao e nao-cartao */}
      {!isEditing && !isCreditCard && (
        <div>
          <label className="label">Saldo inicial (R$)</label>
          <input
            {...register('initial_balance', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
            type="number"
            step="0.01"
            min="0"
            className="input"
            placeholder="0,00 - deixe vazio se não souber"
          />
          <p className="mt-1 text-[11px]" style={{ color: 'rgba(200,198,190,0.35)' }}>
            Será registrado como uma transação de receita inicial.
          </p>
        </div>
      )}

      {/* Cor */}
      <div>
        <label className="label">Cor</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {COLOR_PRESETS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className="w-7 h-7 rounded-full transition-all duration-150"
              style={{
                background:    color,
                outline:       currentColor === color ? `2px solid ${color}` : 'none',
                outlineOffset: '2px',
                opacity:       currentColor === color ? 1 : 0.5,
              }}
            />
          ))}
        </div>
      </div>

      {displayError && (
        <p className="text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
          {displayError}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full justify-center py-2.5"
        disabled={isPending}
      >
        {isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar conta'}
      </button>

      {isEditing && (
        <>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteAccount.isPending}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              confirmDelete
                ? 'bg-red-500 text-white'
                : 'bg-transparent text-red-400 border border-red-500/30'
            }`}
          >
            {deleteAccount.isPending ? 'Excluindo...' : confirmDelete ? 'Confirmar exclusão' : 'Excluir conta'}
          </button>
          {confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="w-full py-2 text-xs"
              style={{ color: 'rgba(200,198,190,0.35)' }}
            >
              Cancelar exclusão
            </button>
          )}
        </>
      )}
    </form>
  )
}
