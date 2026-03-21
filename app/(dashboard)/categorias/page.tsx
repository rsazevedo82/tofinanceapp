// app/(dashboard)/categorias/page.tsx
'use client'

import { useState }         from 'react'
import { useCategories }    from '@/hooks/useCategories'
import { Modal }            from '@/components/ui/Modal'
import { CategoryForm }     from '@/components/finance/CategoryForm'
import type { Category }    from '@/types'

export default function CategoriasPage() {
  const { data: categories = [], isLoading } = useCategories()

  const [showCreate, setShowCreate] = useState(false)
  const [defaultType, setDefaultType] = useState<'income' | 'expense'>('expense')
  const [editing, setEditing]       = useState<Category | null>(null)

  const systemCategories = categories.filter(c => c.user_id === null)
  const userCategories   = categories.filter(c => c.user_id !== null)

  const incomeSystem  = systemCategories.filter(c => c.type === 'income')
  const expenseSystem = systemCategories.filter(c => c.type === 'expense')
  const incomeUser    = userCategories.filter(c => c.type === 'income')
  const expenseUser   = userCategories.filter(c => c.type === 'expense')

  function openCreate(type: 'income' | 'expense') {
    setDefaultType(type)
    setShowCreate(true)
  }

  function handleEdit(cat: Category) {
    if (cat.user_id === null) return
    setEditing(cat)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Categorias</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {systemCategories.length} do sistema · {userCategories.length} suas
          </p>
        </div>
        <button onClick={() => openCreate('expense')} className="btn-primary text-xs">
          <span className="opacity-60">+</span>
          Nova categoria
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="db-row px-2 py-2 animate-pulse">
              <div className="w-2 h-2 rounded-sm bg-white/10" />
              <div className="ml-3 h-3 bg-white/5 rounded w-28" />
            </div>
          ))}
        </div>
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
                    className="text-[10px] px-2 py-1 rounded transition-colors"
                    style={{ color: '#6ee7b7', background: 'rgba(110,231,183,0.08)' }}
                  >
                    + Receita
                  </button>
                  <button
                    onClick={() => openCreate('expense')}
                    className="text-[10px] px-2 py-1 rounded transition-colors"
                    style={{ color: '#fca5a5', background: 'rgba(252,165,165,0.08)' }}
                  >
                    + Despesa
                  </button>
                </div>
              </div>

              {incomeUser.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] uppercase tracking-widest font-medium mb-1.5 px-2"
                    style={{ color: 'rgba(110,231,183,0.5)' }}>Receitas</p>
                  <div className="space-y-0.5">
                    {incomeUser.map(cat => (
                      <CategoryRow key={cat.id} category={cat} onClick={() => handleEdit(cat)} editable />
                    ))}
                  </div>
                </div>
              )}

              {expenseUser.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-medium mb-1.5 px-2"
                    style={{ color: 'rgba(252,165,165,0.5)' }}>Despesas</p>
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
              <p className="section-heading mb-0">Categorias padrao</p>
              <span className="text-[10px] px-2 py-0.5 rounded"
                style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}>
                somente leitura
              </span>
            </div>

            {incomeSystem.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-widest font-medium mb-1.5 px-2"
                  style={{ color: 'rgba(110,231,183,0.5)' }}>Receitas</p>
                <div className="space-y-0.5">
                  {incomeSystem.map(cat => (
                    <CategoryRow key={cat.id} category={cat} />
                  ))}
                </div>
              </div>
            )}

            {expenseSystem.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-1.5 px-2"
                  style={{ color: 'rgba(252,165,165,0.5)' }}>Despesas</p>
                <div className="space-y-0.5">
                  {expenseSystem.map(cat => (
                    <CategoryRow key={cat.id} category={cat} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {userCategories.length === 0 && (
            <div className="py-8 text-center border rounded-xl"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-2xl mb-2">🏷️</p>
              <p className="text-sm font-medium text-[#e8e6e1] mb-1">Crie suas proprias categorias</p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Personalize alem das categorias padrao
              </p>
              <button onClick={() => openCreate('expense')} className="btn-primary text-xs mx-auto">
                <span className="opacity-60">+</span>
                Nova categoria
              </button>
            </div>
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
      style={{ opacity: editable ? 1 : 0.65 }}
    >
      <div
        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
        style={{ background: category.color ?? '#888' }}
      />
      <span className="text-sm text-[#e8e6e1] flex-1">{category.name}</span>
      {editable && (
        <span
          className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'rgba(200,198,190,0.5)' }}
        >
          editar →
        </span>
      )}
    </div>
  )
}