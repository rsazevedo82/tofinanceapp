import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CategoriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user?.id}`)
    .eq('is_active', true)
    .order('type')
    .order('name')

  const income = categories?.filter(c => c.type === 'income') ?? []
  const expense = categories?.filter(c => c.type === 'expense') ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Categorias</h1>

      {[{ label: 'Receitas', items: income }, { label: 'Despesas', items: expense }].map(group => (
        <div key={group.label} className="card">
          <h2 className="text-slate-400 text-sm font-medium mb-4">{group.label}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.items.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color ?? '#6B7280' }}
                />
                <span className="text-slate-300 text-sm truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}