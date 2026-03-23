// components/finance/GoalCard.tsx
'use client'

import { useState }         from 'react'
import { Modal }            from '@/components/ui/Modal'
import { ContributionForm } from '@/components/finance/ContributionForm'
import { useAddContribution, useDeleteGoal, useGoalContributions, useDeleteContribution } from '@/hooks/useGoals'
import type { Goal, GoalContribution } from '@/types'
import type { AddContributionInput } from '@/lib/validations/schemas'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

function daysUntil(deadline: string) {
  const today = new Date()
  const end   = new Date(deadline + 'T00:00:00')
  const diff  = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

// ── ContributionList ──────────────────────────────────────────────────────────

function ContributionList({ goalId, ownUserId }: { goalId: string; ownUserId?: string }) {
  const { data: contributions = [], isLoading } = useGoalContributions(goalId)
  const deleteContribution = useDeleteContribution(goalId)

  if (isLoading) return <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Carregando…</p>
  if (contributions.length === 0) return (
    <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
      Nenhum aporte ainda. Seja o primeiro!
    </p>
  )

  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {contributions.map((c: GoalContribution) => (
        <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs shrink-0">
              {c.user_profile?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
            <div className="min-w-0">
              <p className="text-[#f0ede8] truncate">{c.user_profile?.name ?? 'Você'}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(c.date)}</p>
              {c.notes && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{c.notes}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-emerald-400 font-medium">{formatCurrency(c.amount)}</span>
            {c.user_id === ownUserId && (
              <button
                onClick={() => deleteContribution.mutate(c.id)}
                className="text-white/30 hover:text-red-400 transition-colors text-xs"
                title="Remover aporte"
              >
                ✕
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── GoalCard ──────────────────────────────────────────────────────────────────

interface Props {
  goal:       Goal
  ownUserId?: string
  onEdit?:    (goal: Goal) => void
}

export function GoalCard({ goal, ownUserId, onEdit }: Props) {
  const [showContributions, setShowContributions] = useState(false)
  const [showAddForm,       setShowAddForm]       = useState(false)

  const addContribution = useAddContribution(goal.id)
  const deleteGoal      = useDeleteGoal()

  const current     = goal.current_amount ?? 0
  const target      = goal.target_amount
  const percent     = Math.min(100, Math.round((current / target) * 100))
  const remaining   = Math.max(0, target - current)
  const isCompleted = goal.status === 'completed'
  const isOwner     = goal.user_id === ownUserId
  const isCoupleGoal = !!goal.couple_id
  const days        = goal.deadline ? daysUntil(goal.deadline) : null

  async function handleAddContribution(data: AddContributionInput) {
    await addContribution.mutateAsync(data)
    setShowAddForm(false)
  }

  return (
    <>
      <div
        className="card p-5 flex flex-col gap-4 hover:border-white/20 transition-colors"
        style={{ borderLeftColor: goal.color, borderLeftWidth: 3 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{goal.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[#f0ede8] truncate">{goal.title}</h3>
                {isCoupleGoal && <span className="text-xs px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 shrink-0">casal</span>}
                {isCompleted  && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">✓ concluída</span>}
              </div>
              {goal.description && (
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{goal.description}</p>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-1 shrink-0">
              {onEdit && (
                <button
                  onClick={() => onEdit(goal)}
                  className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors text-xs"
                  title="Editar meta"
                >
                  ✏️
                </button>
              )}
              <button
                onClick={() => deleteGoal.mutate(goal.id)}
                className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors text-xs"
                title="Arquivar meta"
              >
                🗑
              </button>
            </div>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: 'var(--text-muted)' }}>
              {formatCurrency(current)} de {formatCurrency(target)}
            </span>
            <span className={isCompleted ? 'text-emerald-400' : 'text-indigo-300'}>
              {percent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-400' : 'bg-indigo-400'}`}
              style={{ width: `${percent}%`, backgroundColor: isCompleted ? undefined : goal.color }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1.5">
            <span style={{ color: 'var(--text-muted)' }}>
              {isCompleted ? 'Meta atingida!' : `Faltam ${formatCurrency(remaining)}`}
            </span>
            {days !== null && (
              <span style={{ color: days < 0 ? '#f87171' : days <= 30 ? '#fbbf24' : 'var(--text-muted)' }}>
                {days < 0 ? `${Math.abs(days)}d atrasada` : days === 0 ? 'Vence hoje' : `${days}d restantes`}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-white/5">
          <button
            onClick={() => setShowContributions(v => !v)}
            className="text-xs flex-1 py-1.5 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {showContributions ? 'Ocultar aportes' : 'Ver aportes'}
          </button>
          {!isCompleted && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary text-xs flex-1 py-1.5"
            >
              + Aportar
            </button>
          )}
        </div>

        {/* Contributions inline */}
        {showContributions && (
          <div className="pt-2 border-t border-white/5">
            <ContributionList goalId={goal.id} ownUserId={ownUserId} />
          </div>
        )}
      </div>

      {/* Modal: adicionar aporte */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Registrar aporte"
      >
        <ContributionForm
          goalTitle={goal.title}
          onSave={handleAddContribution}
          onCancel={() => setShowAddForm(false)}
          loading={addContribution.isPending}
        />
      </Modal>
    </>
  )
}
