// components/finance/GoalForm.tsx
'use client'

import { useForm }            from 'react-hook-form'
import { zodResolver }        from '@hookform/resolvers/zod'
import { createGoalSchema, updateGoalSchema } from '@/lib/validations/schemas'
import type { CreateGoalInput, UpdateGoalInput } from '@/lib/validations/schemas'
import type { Goal, GoalCategory, CoupleProfile } from '@/types'

const CATEGORY_OPTIONS: { value: GoalCategory; label: string; icon: string }[] = [
  { value: 'travel',    label: 'Viagem',              icon: '✈️' },
  { value: 'property',  label: 'Imóvel',              icon: '🏠' },
  { value: 'emergency', label: 'Reserva emergência',  icon: '🛡️' },
  { value: 'education', label: 'Educação',            icon: '📚' },
  { value: 'vehicle',   label: 'Veículo',             icon: '🚗' },
  { value: 'wedding',   label: 'Casamento',           icon: '💍' },
  { value: 'family',    label: 'Família',             icon: '👨‍👩‍👧' },
  { value: 'tech',      label: 'Tecnologia',          icon: '💻' },
  { value: 'health',    label: 'Saúde',               icon: '❤️' },
  { value: 'custom',    label: 'Outro',               icon: '⭐' },
]

interface Props {
  goal?:    Goal
  couple?:  CoupleProfile | null
  onSave:   (data: CreateGoalInput | UpdateGoalInput) => void
  onCancel: () => void
  loading?: boolean
}

export function GoalForm({ goal, couple, onSave, onCancel, loading }: Props) {
  const isEdit = !!goal

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<CreateGoalInput>({
      resolver: zodResolver(isEdit ? updateGoalSchema : createGoalSchema) as never,
      defaultValues: isEdit ? {
        title:         goal.title,
        description:   goal.description ?? '',
        icon:          goal.icon,
        color:         goal.color as `#${string}`,
        category:      goal.category,
        target_amount: goal.target_amount,
        deadline:      goal.deadline ?? undefined,
        couple_id:     goal.couple_id ?? undefined,
      } : {
        icon:     '⭐',
        color:    '#818cf8',
        category: 'custom',
      },
    })

  const selectedCategory = watch('category')
  const selectedIcon     = watch('icon')

  function onCategorySelect(cat: typeof CATEGORY_OPTIONS[0]) {
    setValue('category', cat.value)
    setValue('icon', cat.icon)
  }

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-5">

      {/* Título */}
      <div>
        <label className="label-sm">Título *</label>
        <input
          {...register('title')}
          className="input-field"
          placeholder="Ex: Viagem para Europa"
          autoFocus
        />
        {errors.title && <p className="error-msg">{errors.title.message}</p>}
      </div>

      {/* Descrição */}
      <div>
        <label className="label-sm">Descrição</label>
        <textarea
          {...register('description')}
          className="input-field resize-none"
          rows={2}
          placeholder="Opcional"
        />
      </div>

      {/* Categoria */}
      <div>
        <label className="label-sm">Categoria</label>
        <div className="grid grid-cols-5 gap-2 mt-1">
          {CATEGORY_OPTIONS.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => onCategorySelect(cat)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs transition-colors ${
                selectedCategory === cat.value
                  ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="leading-tight text-center">{cat.label}</span>
            </button>
          ))}
        </div>
        <input type="hidden" {...register('category')} />
      </div>

      {/* Ícone customizado */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="label-sm">Ícone (emoji)</label>
          <input
            {...register('icon')}
            className="input-field"
            placeholder="⭐"
            maxLength={10}
          />
        </div>
        <div className="flex-1">
          <label className="label-sm">Cor</label>
          <div className="flex gap-2 items-center">
            <input
              {...register('color')}
              type="color"
              className="h-10 w-14 rounded cursor-pointer bg-transparent border border-white/20"
            />
            <input
              {...register('color')}
              className="input-field flex-1"
              placeholder="#818cf8"
            />
          </div>
        </div>
      </div>

      {/* Valor meta */}
      <div>
        <label className="label-sm">Valor alvo (R$) *</label>
        <input
          {...register('target_amount', { valueAsNumber: true })}
          type="number"
          step="0.01"
          min="0.01"
          className="input-field"
          placeholder="0,00"
        />
        {errors.target_amount && <p className="error-msg">{errors.target_amount.message}</p>}
      </div>

      {/* Prazo */}
      <div>
        <label className="label-sm">Prazo</label>
        <input
          {...register('deadline')}
          type="date"
          className="input-field"
        />
      </div>

      {/* Meta de casal */}
      {couple && !isEdit && (
        <div>
          <label className="label-sm flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              onChange={e => setValue('couple_id', e.target.checked ? couple.id : undefined)}
            />
            <span>Meta de casal 💑</span>
          </label>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Ambos podem contribuir e acompanhar o progresso
          </p>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={loading}
        >
          {loading ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar meta'}
        </button>
      </div>
    </form>
  )
}
