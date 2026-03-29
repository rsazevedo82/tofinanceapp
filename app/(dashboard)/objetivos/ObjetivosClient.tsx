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
import { EmptyStatePanel, LoadingStatePanel } from '@/components/ui/StatePanel'
import { Target, Users } from 'lucide-react'
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="page-title">
            {c(isCouple, 'Seus objetivos', 'Objetivos de vocês')}
          </h1>
          <p className="page-subtitle mt-1">
            {goals.length} {goals.length === 1 ? 'meta' : 'metas'} ·{' '}
            {formatCurrency(totalCurrent)} de {formatCurrency(totalTarget)} acumulados
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary w-full sm:w-auto justify-center">
          <span className="text-lg leading-none">+</span> Nova meta
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-[#F3F4F6] w-fit">
        {(['individual', 'couple'] as Scope[]).map(s => (
          <button
            key={s}
            onClick={() => setScope(s)}
            data-active={scope === s}
            className={`touch-target motion-tab interactive-control px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              scope === s
                ? 'bg-[#FF7F50] text-white shadow-sm'
                : 'text-[#334155] hover:text-[#0F172A]'
            }`}
          >
            {s === 'individual' ? 'Meus objetivos' : 'Do casal'}
          </button>
        ))}
      </div>

      {/* Aviso sem perfil de casal */}
      {scope === 'couple' && !couple && (
        <EmptyStatePanel
          icon={<Users size={26} className="text-[#475569]" aria-hidden />}
          tone="couple"
          title="Conectem o perfil de casal para metas em conjunto"
          description="Depois da conexão, vocês podem criar objetivos compartilhados e acompanhar aportes lado a lado."
          nextSteps={[
            'Conecte o perfil de casal para desbloquear metas em conjunto',
            'Definam prazo e valor-alvo para acompanhar aportes dos dois',
          ]}
          action={(
            <Link href="/casal" className="btn-secondary">
              Ir para Perfil Casal
            </Link>
          )}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <LoadingStatePanel rows={3} />
      )}

      {/* Metas ativas */}
      {!isLoading && activeGoals.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3 text-[#334155]">
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
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3 text-[#334155]">
            Concluídas
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
        <EmptyStatePanel
          icon={<Target size={26} className="text-[#475569]" aria-hidden />}
          tone="goals"
          title={scope === 'individual' ? 'Comece pela sua primeira meta' : 'Definam a primeira meta do casal'}
          description={c(
            isCouple,
            'Com uma meta clara, fica mais fácil transformar planejamento em hábito.',
            'Com uma meta clara, vocês transformam planejamento financeiro em rotina.'
          )}
          nextSteps={[
            'Crie uma meta com prazo e valor para acompanhar progresso real',
            scope === 'individual' ? 'Registre aportes recorrentes para acelerar a conclusão' : 'Contribuam juntos para avançar mais rápido',
          ]}
          action={(
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Criar primeiro objetivo
            </button>
          )}
        />
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

