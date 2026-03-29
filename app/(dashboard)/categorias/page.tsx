// app/(dashboard)/categorias/page.tsx
'use client'

import { useMemo, useState } from 'react'
import dynamic              from 'next/dynamic'
import { useCategories }    from '@/hooks/useCategories'
import { Modal }            from '@/components/ui/Modal'
import { useCouple }        from '@/hooks/useCouple'
import { c }                from '@/lib/utils/copy'
import { EmptyStatePanel, LoadingStatePanel } from '@/components/ui/StatePanel'
import { Tag } from 'lucide-react'
import type { Category }    from '@/types'

const CategoryForm = dynamic(
  () => import('@/components/finance/CategoryForm').then(m => m.CategoryForm),
  { ssr: false }
)

export default function CategoriasPage() {
  const { data: couple }                     = useCouple()
  const isCouple                             = !!couple
  const { data: categories = [], isLoading } = useCategories()

  const [showCreate, setShowCreate] = useState(false)
  const [defaultType, setDefaultType] = useState<'income' | 'expense'>('expense')
  const [editing, setEditing]       = useState<Category | null>(null)

  const systemCategories = useMemo(
    () => categories.filter(c => c.user_id === null),
    [categories]
  )
  const userCategories = useMemo(
    () => categories.filter(c => c.user_id !== null),
    [categories]
  )

  const incomeSystem = useMemo(
    () => systemCategories.filter(c => c.type === 'income'),
    [systemCategories]
  )
  const expenseSystem = useMemo(
    () => systemCategories.filter(c => c.type === 'expense'),
    [systemCategories]
  )
  const incomeUser = useMemo(
    () => userCategories.filter(c => c.type === 'income'),
    [userCategories]
  )
  const expenseUser = useMemo(
    () => userCategories.filter(c => c.type === 'expense'),
    [userCategories]
  )

  function openCreate(type: 'income' | 'expense') {
    setDefaultType(type)
    setShowCreate(true)
  }

  function handleEdit(cat: Category) {
    if (cat.user_id === null) return
    setEditing(cat)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8 md:mb-10">
        <div>
          <h1 className="page-title">Categorias</h1>
          <p className="page-subtitle mt-1">
            {systemCategories.length} do sistema · {userCategories.length} suas
          </p>
        </div>
        <button onClick={() => openCreate('expense')} className="btn-primary w-full sm:w-auto justify-center">
          <span className="text-lg leading-none">+</span>
          Nova categoria
        </button>
      </div>

      {isLoading ? (
        <LoadingStatePanel rows={4} />
      ) : (
        <>
          {/* Suas categorias */}
          {userCategories.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <p className="section-heading mb-0">Suas categorias</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openCreate('income')}
                    className="text-xs px-2 py-1 rounded transition-colors font-semibold"
                    style={{ color: '#0d9488', background: 'rgba(45,212,191,0.1)' }}
                  >
                    + Receita
                  </button>
                  <button
                    onClick={() => openCreate('expense')}
                    className="text-xs px-2 py-1 rounded transition-colors font-semibold"
                    style={{ color: '#e86e40', background: 'rgba(255,127,80,0.1)' }}
                  >
                    + Despesa
                  </button>
                </div>
              </div>

              {incomeUser.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-widest font-semibold mb-1.5 px-2"
                    style={{ color: '#2DD4BF' }}>Receitas</p>
                  <div className="space-y-0.5">
                    {incomeUser.map(cat => (
                      <CategoryRow key={cat.id} category={cat} onClick={() => handleEdit(cat)} editable />
                    ))}
                  </div>
                </div>
              )}

              {expenseUser.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-1.5 px-2"
                    style={{ color: '#FF7F50' }}>Despesas</p>
                  <div className="space-y-0.5">
                    {expenseUser.map(cat => (
                      <CategoryRow key={cat.id} category={cat} onClick={() => handleEdit(cat)} editable />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Categorias do sistema */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="section-heading mb-0">Categorias padrão</p>
              <span className="text-xs px-2 py-0.5 rounded bg-[#F3F4F6] text-[#334155]">
                somente leitura
              </span>
            </div>

            {incomeSystem.length > 0 && (
              <div className="mb-3">
                <p className="text-xs uppercase tracking-widest font-semibold mb-1.5 px-2"
                  style={{ color: '#2DD4BF' }}>Receitas</p>
                <div className="space-y-0.5">
                  {incomeSystem.map(cat => (
                    <CategoryRow key={cat.id} category={cat} />
                  ))}
                </div>
              </div>
            )}

            {expenseSystem.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1.5 px-2"
                  style={{ color: '#FF7F50' }}>Despesas</p>
                <div className="space-y-0.5">
                  {expenseSystem.map(cat => (
                    <CategoryRow key={cat.id} category={cat} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {userCategories.length === 0 && (
            <EmptyStatePanel
              icon={<Tag size={26} className="text-[#475569]" aria-hidden />}
              tone="category"
              title={c(isCouple, 'Personalize suas categorias', 'Personalizem categorias com a cara de vocês')}
              description={c(
                isCouple,
                'As categorias padrão já ajudam, mas personalizar deixa os relatórios muito mais úteis.',
                'As categorias padrão já ajudam, mas personalizar deixa os relatórios do casal muito mais úteis.'
              )}
              nextSteps={[
                'Crie categorias para os gastos que mais se repetem',
                'Separe receitas e despesas para relatórios mais claros',
              ]}
              action={(
                <button onClick={() => openCreate('expense')} className="btn-primary">
                  <span className="text-lg leading-none">+</span>
                  Nova categoria
                </button>
              )}
            />
          )}
        </>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nova categoria">
        <CategoryForm defaultType={defaultType} onSuccess={() => setShowCreate(false)} />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar categoria">
        {editing && (
          <CategoryForm category={editing} onSuccess={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  )
}

// ── CategoryRow com group correto ─────────────────────────────────────────────

function CategoryRow({
  category,
  onClick,
  editable = false,
}: {
  category:  Category
  onClick?:  () => void
  editable?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`group db-row flex items-center gap-3 px-2 py-2 ${
        editable ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={{ opacity: editable ? 1 : 0.6 }}
    >
      <div
        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
        style={{ background: category.color ?? '#888' }}
      />
      <span className="text-sm text-[#0F172A] flex-1">{category.name}</span>
      {editable && (
        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity text-[#334155]">
          editar →
        </span>
      )}
    </div>
  )
}

