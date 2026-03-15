import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CategoriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: categories } = await supabase
    .from('categories').select('*')
    .or(`user_id.is.null,user_id.eq.${user?.id}`)
    .eq('is_active', true).order('type').order('name')

  const income  = categories?.filter(c => c.type === 'income')  ?? []
  const expense = categories?.filter(c => c.type === 'expense') ?? []

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#f0ede8] tracking-tight">Categorias</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(200,198,190,0.35)' }}>
          {categories?.length ?? 0} categorias
        </p>
      </div>

      {[{ label: 'Receitas', items: income }, { label: 'Despesas', items: expense }].map(group => (
        <div key={group.label} className="mb-8">
          <p className="section-heading">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map(cat => (
              <div key={cat.id} className="db-row flex items-center gap-3 px-2 py-2">
                <div className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ background: cat.color ?? '#888' }} />
                <span className="text-sm text-[#e8e6e1]">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}