// components/finance/CategoryForm.tsx
'use client'

import { useForm }                                                  from 'react-hook-form'
import { zodResolver }                                              from '@hookform/resolvers/zod'
import { z }                                                        from 'zod'
import { useState }                                                 from 'react'
import { useCreateCategory, useUpdateCategory, useDeleteCategory }  from '@/hooks/useCategories'
import { useSubmitCtaState }                                        from '@/hooks/useSubmitCtaState'
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
    mode:          'onChange',
    reValidateMode:'onChange',
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
        {
          onSuccess: () => {
            markSaved()
            setTimeout(() => onSuccess(), 450)
          },
          onError: (err) => setApiError(err.message),
        }
      )
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => {
          markSaved()
          setTimeout(() => onSuccess(), 450)
        },
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
  const { isSaved, markSaved } = useSubmitCtaState(isPending)

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
                    ? 'border'
                    : 'border'
                  : 'bg-[#F3F4F6] text-[#334155] border border-transparent'
              }`}
              style={currentType === type ? {
                background: type === 'income' ? 'rgba(45,212,191,0.1)' : 'rgba(255,127,80,0.1)',
                color:      type === 'income' ? '#0d9488' : '#FF7F50',
                borderColor: type === 'income' ? 'rgba(45,212,191,0.3)' : 'rgba(255,127,80,0.3)',
              } : undefined}
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
        {errors.name ? (
          <p className="error-msg">{errors.name.message}</p>
        ) : (
          <p className="mt-1 text-xs text-[#334155]">{currentName?.length ?? 0}/100 caracteres</p>
        )}
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
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F3F4F6] border border-[#D1D5DB]">
        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
          style={{ background: currentColor }} />
        <span className="text-sm text-[#0F172A]">
          {currentName || 'Nome da categoria'}
        </span>
        <span className={`ml-auto tag text-xs ${currentType === 'income' ? 'tag-income' : 'tag-expense'}`}>
          {currentType === 'income' ? 'Receita' : 'Despesa'}
        </span>
      </div>

      {apiError && (
        <p className="alert-box alert-box-error">
          {apiError}
        </p>
      )}

      <button
        type="submit"
        className={`btn-primary w-full justify-center py-2.5 ${isSaved ? 'motion-success' : ''}`}
        disabled={isPending || isSaved}
      >
        {isPending
          ? 'Salvando...'
          : isSaved
          ? 'Salvo com sucesso'
          : isEditing
          ? 'Salvar alteracoes'
          : 'Criar categoria'}
      </button>

      {isEditing && (
        <>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteCategory.isPending}
            className={`touch-target w-full rounded-xl text-sm font-medium transition-colors ${
              confirmDelete
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-transparent text-red-500 border border-red-200 hover:bg-red-50'
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
              className="touch-target w-full text-xs text-[#334155] hover:text-[#0F172A] transition-colors"
            >
              Cancelar exclusão
            </button>
          )}
        </>
      )}
    </form>
  )
}

