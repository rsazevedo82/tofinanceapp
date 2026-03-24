// app/(dashboard)/objetivos/page.tsx
'use client'

import { useState }          from 'react'
import { useGoals, useCreateGoal, useUpdateGoal } from '@/hooks/useGoals'
import { useCouple }         from '@/hooks/useCouple'
import { c }                 from '@/lib/utils/copy'
import { GoalCard }          from '@/components/finance/GoalCard'
import { GoalForm }          from '@/components/finance/GoalForm'
import { Modal }             from '@/components/ui/Modal'
import type { Goal }         from '@/types'
import type { CreateGoalInput, UpdateGoalInput } from '@/lib/validations/schemas'

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

  // Usuário logado — obtido via supabase mas simplificado aqui como undefined
  // O GoalCard recebe ownUserId para controle de permissão de remoção/edição
  // O user.id é passado pelo servidor, mas no client usamos uma abordagem mais simples:
  // a API já valida RLS — o botão de editar/deletar é controlado pelo campo user_id do goal

  const activeGoals    = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  const totalTarget  = goals.reduce((s, g) => s + g.target_amount, 0)
  const totalCurrent = goals.reduce((s, g) => s + (g.current_amount ?? 0), 0)

  async function handleCreate(data: CreateGoalInput | UpdateGoalInput) {
    await createGoal.mutateAsync(data as CreateGoalInput)
    setShowCreate(false)
  }

  async function handleUpdate(data: CreateGoalInput | UpdateGoalInput) {
    await updateGoal.mutateAsync(data as UpdateGoalInput)
    setEditing(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">
            {c(isCouple, 'Seus objetivos', 'Objetivos de vocês')}
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {goals.length} {goals.length === 1 ? 'meta' : 'metas'} ·{' '}
            {formatCurrency(totalCurrent)} de {formatCurrency(totalTarget)} acumulados
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">
          <span className="opacity-60">+</span> Nova meta
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-white/5 w-fit">
        {(['individual', 'couple'] as Scope[]).map(s => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              scope === s
                ? 'bg-indigo-500 text-white'
                : 'text-white/50 hover:text-white/80'
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
          <p className="text-[#f0ede8] font-medium mb-1">Nenhum perfil de casal vinculado</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Vincule-se ao seu parceiro em{' '}
            <a href="/casal" className="text-indigo-400 hover:underline">Perfil Casal</a>{' '}
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
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
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
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
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
          <p className="text-[#f0ede8] font-medium mb-1">
            {scope === 'individual' ? 'Você ainda não criou nenhum objetivo' : 'Vocês ainda não definiram um objetivo em conjunto'}
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {c(isCouple, 'Defina um objetivo e acompanhe seu progresso', 'Definam um objetivo e acompanhem juntos')}
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
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
