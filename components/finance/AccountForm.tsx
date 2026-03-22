// components/finance/AccountForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/useAccounts'
import type { Account } from '@/types'

const COLOR_PRESETS = [
  '#6ee7b7', '#34d399', '#60a5fa', '#818cf8',
  '#f472b6', '#fb923c', '#fbbf24', '#a78bfa',
  '#94a3b8', '#f87171',
]

const ACCOUNT_TYPES = [
  { value: 'checking',   label: 'Conta corrente'    },
  { value: 'savings',    label: 'Poupanca'           },
  { value: 'credit',     label: 'Cartao de credito'  },
  { value: 'investment', label: 'Investimento'       },
  { value: 'wallet',     label: 'Carteira'           },
]

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

interface AccountFormProps {
  account?:     Account
  defaultType?: 'checking' | 'savings' | 'credit' | 'investment' | 'wallet'
  onSuccess:    () => void
}

export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const isEditing = !!account
  const router    = useRouter()

  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()

  const [form, setForm] = useState({
    name:            account?.name             ?? '',
    type:            account?.type             ?? 'checking',
    color:           account?.color            ?? '#6ee7b7',
    initial_balance: '',
    credit_limit:    account?.credit_limit?.toString()  ?? '',
    closing_day:     account?.closing_day?.toString()   ?? '25',
    due_day:         account?.due_day?.toString()        ?? '5',
  })

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError]                 = useState('')

  const isCreditCard = form.type === 'credit'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const base: Record<string, unknown> = {
      name:  form.name,
      type:  form.type,
      color: form.color,
    }

    if (isCreditCard) {
      if (!form.credit_limit || !form.closing_day || !form.due_day) {
        setError('Preencha limite, dia de fechamento e vencimento.')
        return
      }
      base.credit_limit = parseFloat(form.credit_limit)
      base.closing_day  = parseInt(form.closing_day)
      base.due_day      = parseInt(form.due_day)
    }

    if (isEditing) {
      updateAccount.mutate(
        { id: account.id, body: base },
        {
          onSuccess: () => { onSuccess(); router.refresh() },
          onError:   (err) => setError(err.message),
        }
      )
    } else {
      const initialValue = parseFloat(form.initial_balance)
      if (!isNaN(initialValue) && initialValue > 0) {
        base.initial_balance = initialValue
      }
      createAccount.mutate(base, {
        onSuccess: () => { onSuccess(); router.refresh() },
        onError:   (err) => setError(err.message),
      })
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteAccount.mutate(account!.id, {
      onSuccess: () => { onSuccess(); router.refresh() },
      onError:   (err) => setError(err.message),
    })
  }

  const isPending = createAccount.isPending || updateAccount.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Nome */}
      <div>
        <label className="label">Nome da conta</label>
        <input
          type="text"
          className="input"
          placeholder="Ex: Nubank, Itau, Carteira..."
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
      </div>

      {/* Tipo */}
      <div>
        <label className="label">Tipo</label>
        <select
          className="input"
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value as AccountType }))}
        >
          {ACCOUNT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Campos especificos de cartao */}
      {isCreditCard && (
        <div className="space-y-3 p-3 rounded-xl"
          style={{ background: 'rgba(129,140,248,0.06)', border: '0.5px solid rgba(129,140,248,0.2)' }}>

          <p className="text-xs font-medium" style={{ color: '#818cf8' }}>
            Configuracoes do cartao
          </p>

          {/* Limite */}
          <div>
            <label className="label">Limite total (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="Ex: 5000,00"
              value={form.credit_limit}
              onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))}
              required={isCreditCard}
            />
          </div>

          {/* Dia de fechamento e vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dia de fechamento</label>
              <select
                className="input"
                value={form.closing_day}
                onChange={e => setForm(f => ({ ...f, closing_day: e.target.value }))}
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Dia de vencimento</label>
              <select
                className="input"
                value={form.due_day}
                onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))}
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
            type="number"
            step="0.01"
            min="0"
            className="input"
            placeholder="0,00 - deixe vazio se nao souber"
            value={form.initial_balance}
            onChange={e => setForm(f => ({ ...f, initial_balance: e.target.value }))}
          />
          <p className="mt-1 text-[11px]" style={{ color: 'rgba(200,198,190,0.35)' }}>
            Sera registrado como uma transacao de receita inicial.
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
              onClick={() => setForm(f => ({ ...f, color }))}
              className="w-7 h-7 rounded-full transition-all duration-150"
              style={{
                background:    color,
                outline:       form.color === color ? `2px solid ${color}` : 'none',
                outlineOffset: '2px',
                opacity:       form.color === color ? 1 : 0.5,
              }}
            />
          ))}
        </div>
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
        disabled={isPending}
      >
        {isPending ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Criar conta'}
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
            {deleteAccount.isPending ? 'Excluindo...' : confirmDelete ? 'Confirmar exclusao' : 'Excluir conta'}
          </button>
          {confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="w-full py-2 text-xs"
              style={{ color: 'rgba(200,198,190,0.35)' }}
            >
              Cancelar exclusao
            </button>
          )}
        </>
      )}
    </form>
  )
}