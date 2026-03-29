// components/finance/SplitForm.tsx
'use client'

import { useForm }             from 'react-hook-form'
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

function round2(value: number) {
  return Math.round(value * 100) / 100
}

export function SplitForm({ couple, onSave, onCancel, loading }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, watch, formState: { errors } } =
    useForm<CreateSplitInput>({
      resolver: zodResolver(createSplitSchema) as never,
      mode: 'onChange',
      reValidateMode: 'onChange',
      defaultValues: {
        couple_id:   couple.id,
        date:        today,
        split_mode:  'equal',
      },
    })

  const totalAmount = watch('total_amount') ?? 0
  const splitMode = watch('split_mode') ?? 'equal'
  const manualPartnerAmount = watch('partner_amount') ?? 0
  const date = watch('date')
  const partnerName = couple.partner?.name ?? 'Parceiro(a)'

  let partnerAmount = 0
  let payerAmount = 0

  if (totalAmount > 0) {
    if (splitMode === 'manual') {
      partnerAmount = round2(Math.max(0, Math.min(manualPartnerAmount, totalAmount)))
      payerAmount = round2(totalAmount - partnerAmount)
    } else {
      partnerAmount = round2(totalAmount / 2)
      payerAmount = round2(totalAmount - partnerAmount)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSave as never)} className="space-y-5">
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
          {!errors.total_amount && (
            <p className="mt-1 text-xs text-[#334155]">Use até 2 casas decimais.</p>
          )}
        </div>
        <div className="flex-1">
          <label className="label-sm">Data *</label>
          <input
            {...register('date')}
            type="date"
            className="input-field"
          />
          {errors.date && <p className="error-msg">{errors.date.message}</p>}
          {!errors.date && date && (
            <p className="mt-1 text-xs text-[#334155]">
              {new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {/* Modo de divisão */}
      <div>
        <label className="label-sm">Como dividir</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <label className="rounded-lg border border-[#D1D5DB] bg-[#FFFFFF] p-3 text-sm cursor-pointer">
            <input
              {...register('split_mode')}
              type="radio"
              value="equal"
              className="mr-2 accent-[#FF7F50]"
            />
            Dividir igualmente (50/50)
          </label>
          <label className="rounded-lg border border-[#D1D5DB] bg-[#FFFFFF] p-3 text-sm cursor-pointer">
            <input
              {...register('split_mode')}
              type="radio"
              value="manual"
              className="mr-2 accent-[#FF7F50]"
            />
            Valor fixo do parceiro
          </label>
        </div>
      </div>

      {splitMode === 'manual' && (
        <div>
          <label className="label-sm">Quanto {partnerName} deve pagar (R$) *</label>
          <input
            {...register('partner_amount', {
              setValueAs: (value: string) => value === '' ? undefined : Number(value),
            })}
            type="number"
            step="0.01"
            min="0.01"
            className="input-field"
            placeholder="0,00"
          />
          {errors.partner_amount && <p className="error-msg">{errors.partner_amount.message}</p>}
        </div>
      )}

      {errors.split_mode && (
        <p className="error-msg">{errors.split_mode.message}</p>
      )}

      {/* Resumo */}
      {totalAmount > 0 && (
        <div className="rounded-lg bg-[#F3F4F6] border border-[#D1D5DB] p-3 text-sm space-y-1">
          <p className="text-[#334155]">Resumo da divisão</p>
          <p className="text-[#0F172A]">Você paga <span className="font-semibold">{formatCurrency(payerAmount)}</span></p>
          <p className="text-[#0F172A]">{partnerName} paga <span className="font-semibold">{formatCurrency(partnerAmount)}</span></p>
          <p className="text-xs text-[#64748B]">
            {splitMode === 'equal' ? 'Modo 50/50 aplicado.' : 'Modo manual por valor fixo aplicado.'}
          </p>
        </div>
      )}

      {splitMode === 'manual' && totalAmount > 0 && partnerAmount >= totalAmount && (
        <p className="error-msg">O valor do parceiro deve ser menor que o valor total.</p>
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

