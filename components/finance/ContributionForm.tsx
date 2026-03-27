// components/finance/ContributionForm.tsx
'use client'

import { useForm }             from 'react-hook-form'
import { zodResolver }         from '@hookform/resolvers/zod'
import { addContributionSchema } from '@/lib/validations/schemas'
import type { AddContributionInput } from '@/lib/validations/schemas'

interface Props {
  goalTitle:  string
  onSave:     (data: AddContributionInput) => void
  onCancel:   () => void
  loading?:   boolean
}

export function ContributionForm({ goalTitle, onSave, onCancel, loading }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, formState: { errors } } = useForm<AddContributionInput>({
    resolver: zodResolver(addContributionSchema),
    defaultValues: { date: today },
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Registrar aporte em <span className="text-[#0F172A] font-medium">{goalTitle}</span>
      </p>

      <div>
        <label className="label-sm">Valor (R$) *</label>
        <input
          {...register('amount', { valueAsNumber: true })}
          type="number"
          step="0.01"
          min="0.01"
          className="input-field"
          placeholder="0,00"
          autoFocus
        />
        {errors.amount && <p className="error-msg">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="label-sm">Data *</label>
        <input
          {...register('date')}
          type="date"
          className="input-field"
        />
        {errors.date && <p className="error-msg">{errors.date.message}</p>}
      </div>

      <div>
        <label className="label-sm">Observação</label>
        <input
          {...register('notes')}
          className="input-field"
          placeholder="Opcional"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Salvando…' : 'Registrar aporte'}
        </button>
      </div>
    </form>
  )
}
