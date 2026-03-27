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

  if (isLoading) return <p className="text-xs text-center py-4 text-[#6B7280]">Carregando…</p>
  if (contributions.length === 0) return (
    <p className="text-xs text-center py-4 text-[#6B7280]">
      Nenhum aporte ainda. Seja o primeiro!
    </p>
  )

  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {contributions.map((c: GoalContribution) => (
        <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold"
              style={{ background: 'rgba(255,127,80,0.12)', color: '#FF7F50' }}>
              {c.user_profile?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
            <div className="min-w-0">
              <p className="text-[#0F172A] truncate">{c.user_profile?.name ?? 'Você'}</p>
              <p className="text-xs text-[#6B7280]">{formatDate(c.date)}</p>
              {c.notes && <p className="text-xs truncate text-[#6B7280]">{c.notes}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold" style={{ color: '#2DD4BF' }}>{formatCurrency(c.amount)}</span>
            {c.user_id === ownUserId && (
              <button
                onClick={() => deleteContribution.mutate(c.id)}
                className="text-[#D1D5DB] hover:text-red-500 transition-colors text-xs"
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
        className="card p-5 flex flex-col gap-4 hover:border-[#D1D5DB] transition-colors"
        style={{ borderLeftColor: goal.color, borderLeftWidth: 3 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{goal.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#0F172A] truncate">{goal.title}</h3>
                {isCoupleGoal && (
                  <span className="text-xs px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: 'rgba(236,72,153,0.1)', color: '#db2777' }}>
                    casal
                  </span>
                )}
                {isCompleted && (
                  <span className="text-xs px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: 'rgba(45,212,191,0.12)', color: '#0d9488' }}>
                    ✓ concluída
                  </span>
                )}
              </div>
              {goal.description && (
                <p className="text-xs truncate mt-0.5 text-[#6B7280]">{goal.description}</p>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-1 shrink-0">
              {onEdit && (
                <button
                  onClick={() => onEdit(goal)}
                  className="p-1.5 rounded hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#0F172A] transition-colors text-xs"
                  title="Editar meta"
                >
                  ✏️
                </button>
              )}
              <button
                onClick={() => deleteGoal.mutate(goal.id)}
                className="p-1.5 rounded hover:bg-[#F3F4F6] text-[#6B7280] hover:text-red-500 transition-colors text-xs"
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
            <span className="text-[#6B7280]">
              {formatCurrency(current)} de {formatCurrency(target)}
            </span>
            <span style={{ color: isCompleted ? '#2DD4BF' : '#FF7F50' }}>
              {percent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percent}%`,
                background: isCompleted ? '#2DD4BF' : (goal.color ?? '#FF7F50'),
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1.5">
            <span className="text-[#6B7280]">
              {isCompleted ? 'Meta atingida!' : `Faltam ${formatCurrency(remaining)}`}
            </span>
            {days !== null && (
              <span style={{ color: days < 0 ? '#ef4444' : days <= 30 ? '#F59E0B' : '#6B7280' }}>
                {days < 0 ? `${Math.abs(days)}d atrasada` : days === 0 ? 'Vence hoje' : `${days}d restantes`}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-[#D1D5DB]">
          <button
            onClick={() => setShowContributions(v => !v)}
            className="text-xs flex-1 py-1.5 rounded hover:bg-[#F3F4F6] transition-colors text-[#6B7280]"
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
          <div className="pt-2 border-t border-[#D1D5DB]">
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
