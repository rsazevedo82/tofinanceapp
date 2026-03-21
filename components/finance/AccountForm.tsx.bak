// components/finance/AccountForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/useAccounts'
import type { Account } from '@/types'

// Paleta de cores pré-definidas para facilitar a escolha
const COLOR_PRESETS = [
  '#6ee7b7', '#34d399', '#60a5fa', '#818cf8',
  '#f472b6', '#fb923c', '#fbbf24', '#a78bfa',
  '#94a3b8', '#f87171',
]

const ACCOUNT_TYPES = [
  { value: 'checking',   label: 'Conta corrente' },
  { value: 'savings',    label: 'Poupança'        },
  { value: 'credit',     label: 'Cartão de crédito' },
  { value: 'investment', label: 'Investimento'    },
  { value: 'wallet',     label: 'Carteira'        },
]

interface AccountFormProps {
  account?: Account        // se passado, modo edição
  onSuccess: () => void
}

export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const isEditing = !!account
  const router    = useRouter()

  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()

  const [form, setForm] = useState({
    name:            account?.name    ?? '',
    type:            account?.type    ?? 'checking',
    color:           account?.color   ?? '#6ee7b7',
    initial_balance: '',   // só no modo criação
  })

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError]                 = useState('')

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (isEditing) {
      // Modo edição: só envia campos de configuração
      updateAccount.mutate(
        {
          id:   account.id,
          body: { name: form.name, type: form.type, color: form.color },
        },
        {
          onSuccess: () => { onSuccess(); router.refresh() },
          onError:   (err) => setError(err.message),
        }
      )
    } else {
      // Modo criação: envia saldo inicial se informado
      const body: Record<string, unknown> = {
        name:  form.name,
        type:  form.type,
        color: form.color,
      }

      const initialValue = parseFloat(form.initial_balance)
      if (!isNaN(initialValue) && initialValue > 0) {
        body.initial_balance = initialValue
      }

      createAccount.mutate(body, {
        onSuccess: () => { onSuccess(); router.refresh() },
        onError:   (err) => setError(err.message),
      })
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }

    deleteAccount.mutate(account!.id, {
      onSuccess: () => { onSuccess(); router.refresh() },
      onError:   (err) => setError(err.message),
    })
  }

  const isPending = createAccount.isPending || updateAccount.isPending

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Nome */}
      <div>
        <label className="label">Nome da conta</label>
        <input
          type="text"
          className="input"
          placeholder="Ex: Nubank, Itaú, Carteira..."
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
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          required
        >
          {ACCOUNT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Saldo inicial — somente criação */}
      {!isEditing && (
        <div>
          <label className="label">Saldo inicial (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            placeholder="0,00 — deixe vazio se não souber"
            value={form.initial_balance}
            onChange={e => setForm(f => ({ ...f, initial_balance: e.target.value }))}
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
              onClick={() => setForm(f => ({ ...f, color }))}
              className="w-7 h-7 rounded-full transition-all duration-150"
              style={{
                background:  color,
                outline:     form.color === color ? `2px solid ${color}` : 'none',
                outlineOffset: '2px',
                opacity:     form.color === color ? 1 : 0.5,
              }}
              aria-label={`Cor ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <p className="text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5' }}>
          {error}
        </p>
      )}

      {/* Salvar */}
      <button
        type="submit"
        className="btn-primary w-full justify-center py-2.5"
        disabled={isPending}
      >
        {isPending
          ? 'Salvando...'
          : isEditing ? 'Salvar alterações' : 'Criar conta'}
      </button>

      {/* Excluir — somente edição */}
      {isEditing && (
        <>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteAccount.isPending}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              confirmDelete
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-transparent text-red-400 border border-red-500/30 hover:bg-red-500/10'
            }`}
          >
            {deleteAccount.isPending
              ? 'Excluindo...'
              : confirmDelete
              ? 'Confirmar exclusão'
              : 'Excluir conta'}
          </button>

          {confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="w-full py-2 text-xs transition-colors"
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
