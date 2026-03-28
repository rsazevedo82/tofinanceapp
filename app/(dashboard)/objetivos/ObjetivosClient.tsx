// app/(dashboard)/objetivos/page.tsx
'use client'

import { useMemo, useState } from 'react'
import dynamic               from 'next/dynamic'
import Link                  from 'next/link'
import { useGoals, useCreateGoal, useUpdateGoal } from '@/hooks/useGoals'
import { useCouple }         from '@/hooks/useCouple'
import { c }                 from '@/lib/utils/copy'
import { GoalCard }          from '@/components/finance/GoalCard'
import { Modal }             from '@/components/ui/Modal'
import type { Goal }         from '@/types'
import type { CreateGoalInput, UpdateGoalInput } from '@/lib/validations/schemas'

const GoalForm = dynamic(
  () => import('@/components/finance/GoalForm').then(m => m.GoalForm),
  { ssr: false }
)

type Scope = 'individual' | 'couple'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function ObjetivosPage() {
  const [scope, setScope]     = useState<Scope>('individual')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)

  const { data: couple }                    = useCouple()
  const isCouple                            = !!couple
  const { data: goals = [], isLoading }     = useGoals(scope)
  const createGoal                          = useCreateGoal()
  const updateGoal                          = useUpdateGoal(editing?.id ?? '')

  const activeGoals = useMemo(
    () => goals.filter(g => g.status === 'active'),
    [goals]
  )
  const completedGoals = useMemo(
    () => goals.filter(g => g.status === 'completed'),
    [goals]
  )

  const totalTarget = useMemo(
    () => goals.reduce((s, g) => s + g.target_amount, 0),
    [goals]
  )
  const totalCurrent = useMemo(
    () => goals.reduce((s, g) => s + (g.current_amount ?? 0), 0),
    [goals]
  )

  async function handleCreate(data: CreateGoalInput | UpdateGoalInput) {
    await createGoal.mutateAsync(data as CreateGoalInput)
    setShowCreate(false)
  }

  async function handleUpdate(data: CreateGoalInput | UpdateGoalInput) {
    await updateGoal.mutateAsync(data as UpdateGoalInput)
    setEditing(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 md:py-12">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
            {c(isCouple, 'Seus objetivos', 'Objetivos de vocês')}
          </h1>
          <p className="text-sm mt-1 text-[#6B7280]">
            {goals.length} {goals.length === 1 ? 'meta' : 'metas'} ·{' '}
            {formatCurrency(totalCurrent)} de {formatCurrency(totalTarget)} acumulados
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <span className="text-lg leading-none">+</span> Nova meta
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-[#F3F4F6] w-fit">
        {(['individual', 'couple'] as Scope[]).map(s => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              scope === s
                ? 'bg-[#FF7F50] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#0F172A]'
            }`}
          >
            {s === 'individual' ? '👤 Meus objetivos' : '💑 Do casal'}
          </button>
        ))}
      </div>

      {/* Aviso sem perfil de casal */}
      {scope === 'couple' && !couple && (
        <div className="card p-6 text-center">
          <p className="text-2xl mb-2">💑</p>
          <p className="text-[#0F172A] font-semibold mb-1">Nenhum perfil de casal vinculado</p>
          <p className="text-sm text-[#6B7280]">
            Vincule-se ao seu parceiro em{' '}
            <Link href="/casal" className="text-[#FF7F50] hover:underline font-medium">Perfil Casal</Link>{' '}
            para criar objetivos compartilhados.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-40" />)}
        </div>
      )}

      {/* Metas ativas */}
      {!isLoading && activeGoals.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3 text-[#6B7280]">
            Em andamento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={setEditing}
              />
            ))}
          </div>
        </section>
      )}

      {/* Metas concluídas */}
      {!isLoading && completedGoals.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3 text-[#6B7280]">
            Concluídas 🎉
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={setEditing}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && goals.length === 0 && !(scope === 'couple' && !couple) && (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-[#0F172A] font-semibold mb-1">
            {scope === 'individual' ? 'Você ainda não criou nenhum objetivo' : 'Vocês ainda não definiram um objetivo em conjunto'}
          </p>
          <p className="text-sm mb-4 text-[#6B7280]">
            {c(isCouple, 'Defina um objetivo e acompanhe seu progresso', 'Definam um objetivo e acompanhem juntos')}
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Criar primeiro objetivo
          </button>
        </div>
      )}

      {/* Modal criar */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nova meta">
        <GoalForm
          couple={couple}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={createGoal.isPending}
        />
      </Modal>

      {/* Modal editar */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar meta">
        {editing && (
          <GoalForm
            goal={editing}
            couple={couple}
            onSave={handleUpdate}
            onCancel={() => setEditing(null)}
            loading={updateGoal.isPending}
          />
        )}
      </Modal>
    </div>
  )
}
