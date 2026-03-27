// app/api/categories/route.ts
import { createClient }          from '@/lib/supabase/server'
import { createCategorySchema }  from '@/lib/validations/schemas'
import { checkRateLimitByIP, checkRateLimitByUser } from '@/lib/apiHelpers'
import type { ApiResponse, Category } from '@/types'
import { NextResponse }          from 'next/server'

export async function GET(): Promise<NextResponse<ApiResponse<Category[]>>> {
  const limited = await checkRateLimitByIP('categories:get')
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('categories:get', user.id)
    if (userLimited) return userLimited

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('type')
      .order('name')

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[GET /api/categories]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Category>>> {
  const limited = await checkRateLimitByIP('categories:write')
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('categories:write', user.id)
    if (userLimited) return userLimited

    const body   = await request.json()
    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados invalidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', parsed.data.name)
      .eq('type', parsed.data.type)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return NextResponse.json(
        { data: null, error: 'Ja existe uma categoria com esse nome e tipo.' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ ...parsed.data, user_id: user.id, is_active: true })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/categories]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
