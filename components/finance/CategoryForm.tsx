// components/finance/CategoryForm.tsx
'use client'

import { useForm }                                                  from 'react-hook-form'
import { zodResolver }                                              from '@hookform/resolvers/zod'
import { z }                                                        from 'zod'
import { useState }                                                 from 'react'
import { useCreateCategory, useUpdateCategory, useDeleteCategory }  from '@/hooks/useCategories'
import { createCategorySchema }                                     from '@/lib/validations/schemas'
import type { Category }                                            from '@/types'

type FormValues = z.infer<typeof createCategorySchema>

const COLOR_PRESETS = [
  '#6ee7b7', '#34d399', '#10b981',
  '#60a5fa', '#818cf8', '#a78bfa',
  '#f472b6', '#fb923c', '#fbbf24',
  '#fca5a5', '#f87171', '#94a3b8',
]

interface CategoryFormProps {
  category?:    Category
  defaultType?: 'income' | 'expense'
  onSuccess:    () => void
}

export function CategoryForm({ category, defaultType = 'expense', onSuccess }: CategoryFormProps) {
  const isEditing = !!category

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [apiError,      setApiError]      = useState('')

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver:      zodResolver(createCategorySchema),
    defaultValues: {
      name:  category?.name  ?? '',
      type:  category?.type  ?? defaultType,
      color: category?.color ?? '#fca5a5',
    },
  })

  const currentType  = watch('type')
  const currentColor = watch('color')
  const currentName  = watch('name')

  function onSubmit(data: FormValues) {
    setApiError('')
    const payload = { name: data.name, type: data.type, color: data.color }

    if (isEditing) {
      updateCategory.mutate(
        { id: category.id, body: payload },
        { onSuccess: () => onSuccess(), onError: (err) => setApiError(err.message) }
      )
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => onSuccess(),
        onError:   (err) => setApiError(err.message),
      })
    }
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteCategory.mutate(category!.id, {
      onSuccess: () => onSuccess(),
      onError:   (err) => setApiError(err.message),
    })
  }

  const isPending    = createCategory.isPending || updateCategory.isPending
  const displayError = Object.values(errors)[0]?.message ?? apiError

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Tipo — só no modo criação */}
      {!isEditing && (
        <div className="grid grid-cols-2 gap-2">
          {(['expense', 'income'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue('type', type)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentType === type
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
          {...register('name')}
          type="text"
          className="input"
          placeholder="Ex: Alimentação, Salário..."
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
              onClick={() => setValue('color', color)}
              className="w-7 h-7 rounded-full transition-all duration-150"
              style={{
                background:    color,
                outline:       currentColor === color ? `2px solid ${color}` : 'none',
                outlineOffset: '2px',
                opacity:       currentColor === color ? 1 : 0.5,
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
          style={{ background: currentColor }} />
        <span className="text-sm text-[#e8e6e1]">
          {currentName || 'Nome da categoria'}
        </span>
        <span className="ml-auto tag tag-neutral text-[10px]">
          {currentType === 'income' ? 'Receita' : 'Despesa'}
        </span>
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
        {isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar categoria'}
      </button>

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
