// components/finance/CategoryForm.tsx
'use client'

import { useState } from 'react'
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories'
import type { Category } from '@/types'

const COLOR_PRESETS = [
  '#6ee7b7', '#34d399', '#10b981',
  '#60a5fa', '#818cf8', '#a78bfa',
  '#f472b6', '#fb923c', '#fbbf24',
  '#fca5a5', '#f87171', '#94a3b8',
]

interface CategoryFormProps {
  category?: Category    // se passado, modo edição
  defaultType?: 'income' | 'expense'
  onSuccess: () => void
}

export function CategoryForm({ category, defaultType = 'expense', onSuccess }: CategoryFormProps) {
  const isEditing = !!category

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [form, setForm] = useState({
    name:  category?.name  ?? '',
    type:  category?.type  ?? defaultType,
    color: category?.color ?? '#fca5a5',
  })

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError]                 = useState('')

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const payload = { name: form.name, type: form.type, color: form.color }

    if (isEditing) {
      updateCategory.mutate(
        { id: category.id, body: payload },
        {
          onSuccess: () => onSuccess(),
          onError:   (err) => setError(err.message),
        }
      )
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => onSuccess(),
        onError:   (err) => setError(err.message),
      })
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }

    deleteCategory.mutate(category!.id, {
      onSuccess: () => onSuccess(),
      onError:   (err) => setError(err.message),
    })
  }

  const isPending = createCategory.isPending || updateCategory.isPending

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Tipo — só no modo criação */}
      {!isEditing && (
        <div className="grid grid-cols-2 gap-2">
          {(['expense', 'income'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm(f => ({ ...f, type }))}
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
      )}

      {/* Nome */}
      <div>
        <label className="label">Nome da categoria</label>
        <input
          type="text"
          className="input"
          placeholder="Ex: Alimentação, Salário..."
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
      </div>

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
              aria-label={`Cor ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
          style={{ background: form.color }} />
        <span className="text-sm text-[#e8e6e1]">
          {form.name || 'Nome da categoria'}
        </span>
        <span className="ml-auto tag tag-neutral text-[10px]">
          {form.type === 'income' ? 'Receita' : 'Despesa'}
        </span>
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
          : isEditing ? 'Salvar alterações' : 'Criar categoria'}
      </button>

      {/* Excluir — somente edição de categoria do usuário */}
      {isEditing && (
        <>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteCategory.isPending}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              confirmDelete
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-transparent text-red-400 border border-red-500/30 hover:bg-red-500/10'
            }`}
          >
            {deleteCategory.isPending
              ? 'Excluindo...'
              : confirmDelete
              ? 'Confirmar exclusão'
              : 'Excluir categoria'}
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
