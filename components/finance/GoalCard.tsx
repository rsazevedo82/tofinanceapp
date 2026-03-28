// components/finance/GoalCard.tsx
'use client'

import { useEffect, useRef, useState }         from 'react'
import dynamic              from 'next/dynamic'
import { Modal }            from '@/components/ui/Modal'
import { useAddContribution, useDeleteGoal, useGoalContributions, useDeleteContribution } from '@/hooks/useGoals'
import { Pencil, Trash2, X } from 'lucide-react'
import type { Goal, GoalContribution } from '@/types'
import type { AddContributionInput } from '@/lib/validations/schemas'

const ContributionForm = dynamic(
  () => import('@/components/finance/ContributionForm').then(m => m.ContributionForm),
  { ssr: false }
)

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

  if (isLoading) return <p className="text-xs text-center py-4 text-[#334155]">Carregando…</p>
  if (contributions.length === 0) return (
    <p className="text-xs text-center py-4 text-[#334155]">
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
              <p className="text-xs text-[#334155]">{formatDate(c.date)}</p>
              {c.notes && <p className="text-xs truncate text-[#334155]">{c.notes}</p>}
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
                <X size={12} aria-hidden />
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
  const [showCheckpoint, setShowCheckpoint] = useState(false)

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
  const previousPercentRef = useRef(percent)

  useEffect(() => {
    if (percent >= 100 && previousPercentRef.current < 100) {
      setShowCheckpoint(true)
      const timer = setTimeout(() => setShowCheckpoint(false), 1100)
      previousPercentRef.current = percent
      return () => clearTimeout(timer)
    }
    previousPercentRef.current = percent
  }, [percent])

  async function handleAddContribution(data: AddContributionInput) {
    await addContribution.mutateAsync(data)
    setShowAddForm(false)
  }

  return (
    <>
      <div
        className="card card-compact flex flex-col gap-4 hover:border-[#D1D5DB] transition-colors"
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
                  <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${showCheckpoint ? 'motion-checkpoint' : ''}`}
                    style={{ background: 'rgba(45,212,191,0.12)', color: '#0d9488' }}>
                    ✓ concluída
                  </span>
                )}
              </div>
              {goal.description && (
                <p className="text-xs truncate mt-0.5 text-[#334155]">{goal.description}</p>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-1 shrink-0">
              {onEdit && (
                <button
                  onClick={() => onEdit(goal)}
                  className="p-1.5 rounded hover:bg-[#F3F4F6] text-[#334155] hover:text-[#0F172A] transition-colors text-xs"
                  title="Editar meta"
                >
                  <Pencil size={13} aria-hidden />
                </button>
              )}
              <button
                onClick={() => deleteGoal.mutate(goal.id)}
                className="p-1.5 rounded hover:bg-[#F3F4F6] text-[#334155] hover:text-red-500 transition-colors text-xs"
                title="Arquivar meta"
              >
                <Trash2 size={13} aria-hidden />
              </button>
            </div>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-[#334155]">
              {formatCurrency(current)} de {formatCurrency(target)}
            </span>
            <span style={{ color: isCompleted ? '#2DD4BF' : '#FF7F50' }}>
              {percent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
            <div
              className="h-full rounded-full motion-progress"
              style={{
                width: `${percent}%`,
                background: isCompleted
                  ? 'linear-gradient(90deg, #2DD4BF 0%, #14B8A6 50%, #2DD4BF 100%)'
                  : 'linear-gradient(90deg, var(--goal-color, #FF7F50) 0%, #FB923C 50%, var(--goal-color, #FF7F50) 100%)',
                ['--goal-color' as string]: goal.color ?? '#FF7F50',
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1.5">
            <span className="text-[#334155]">
              {isCompleted ? 'Meta atingida!' : `Faltam ${formatCurrency(remaining)}`}
            </span>
            {days !== null && (
              <span style={{ color: days < 0 ? '#ef4444' : days <= 30 ? '#F59E0B' : '#334155' }}>
                {days < 0 ? `${Math.abs(days)}d atrasada` : days === 0 ? 'Vence hoje' : `${days}d restantes`}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-[#D1D5DB]">
          <button
            onClick={() => setShowContributions(v => !v)}
            data-active={showContributions}
            className="motion-tab text-xs flex-1 py-1.5 rounded hover:bg-[#F3F4F6] text-[#334155]"
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
        <div className="motion-expand pt-2 border-t border-[#D1D5DB]" data-open={showContributions}>
          {showContributions ? (
            <ContributionList goalId={goal.id} ownUserId={ownUserId} />
          ) : null}
        </div>
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

