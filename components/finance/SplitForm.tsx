// components/finance/SplitForm.tsx
'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver }         from '@hookform/resolvers/zod'
import { createSplitSchema }   from '@/lib/validations/schemas'
import type { CreateSplitInput } from '@/lib/validations/schemas'
import type { CoupleProfile }  from '@/types'

interface Props {
  couple:   CoupleProfile
  onSave:   (data: CreateSplitInput) => void
  onCancel: () => void
  loading?: boolean
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function SplitForm({ couple, onSave, onCancel, loading }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, watch, control, formState: { errors } } =
    useForm<CreateSplitInput>({
      resolver: zodResolver(createSplitSchema),
      defaultValues: {
        couple_id:           couple.id,
        date:                today,
        payer_share_percent: 50,
      },
    })

  const totalAmount        = watch('total_amount') ?? 0
  const payerSharePercent  = watch('payer_share_percent') ?? 50
  const partnerSharePercent = 100 - payerSharePercent

  const payerAmount   = totalAmount > 0 ? (totalAmount * payerSharePercent  / 100) : 0
  const partnerAmount = totalAmount > 0 ? (totalAmount * partnerSharePercent / 100) : 0

  const partnerName = couple.partner?.name ?? 'Parceiro(a)'

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-5">
      <input type="hidden" {...register('couple_id')} />

      {/* Descrição */}
      <div>
        <label className="label-sm">Descrição *</label>
        <input
          {...register('description')}
          className="input-field"
          placeholder="Ex: Jantar no restaurante"
          autoFocus
        />
        {errors.description && <p className="error-msg">{errors.description.message}</p>}
      </div>

      {/* Valor + Data */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="label-sm">Valor total (R$) *</label>
          <input
            {...register('total_amount', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0.01"
            className="input-field"
            placeholder="0,00"
          />
          {errors.total_amount && <p className="error-msg">{errors.total_amount.message}</p>}
        </div>
        <div className="flex-1">
          <label className="label-sm">Data *</label>
          <input
            {...register('date')}
            type="date"
            className="input-field"
          />
          {errors.date && <p className="error-msg">{errors.date.message}</p>}
        </div>
      </div>

      {/* Divisão */}
      <div>
        <label className="label-sm">Sua parte</label>
        <Controller
          name="payer_share_percent"
          control={control}
          render={({ field }) => (
            <input
              type="range"
              min={1}
              max={99}
              step={1}
              value={field.value}
              onChange={e => field.onChange(Number(e.target.value))}
              className="w-full accent-indigo-400 mt-2"
            />
          )}
        />
        <div className="flex justify-between text-xs mt-2">
          <span className="text-[#f0ede8] font-medium">
            Você: {payerSharePercent}% ({formatCurrency(payerAmount)})
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            {partnerName}: {partnerSharePercent}% ({formatCurrency(partnerAmount)})
          </span>
        </div>

        {/* Shortcut 50/50 */}
        <button
          type="button"
          onClick={() => {
            const el = document.querySelector('input[type=range]') as HTMLInputElement
            if (el) { el.value = '50'; el.dispatchEvent(new Event('input', { bubbles: true })) }
          }}
          className="text-xs text-indigo-400 hover:underline mt-1"
        >
          Dividir igualmente (50/50)
        </button>
        {errors.payer_share_percent && <p className="error-msg">{errors.payer_share_percent.message}</p>}
      </div>

      {/* Preview */}
      {totalAmount > 0 && (
        <div className="rounded-lg bg-white/5 p-3 text-sm space-y-1">
          <p style={{ color: 'var(--text-muted)' }}>Resumo</p>
          <p className="text-[#f0ede8]">
            {partnerName} fica devendo{' '}
            <span className="text-amber-400 font-semibold">{formatCurrency(partnerAmount)}</span> para você
          </p>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Salvando…' : 'Registrar divisão'}
        </button>
      </div>
    </form>
  )
}
