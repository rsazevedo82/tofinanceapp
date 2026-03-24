// app/api/profile/route.ts
import { createClient }        from '@/lib/supabase/server'
import { checkRateLimit }      from '@/lib/apiHelpers'
import { updateProfileSchema } from '@/lib/validations/schemas'
import type { ApiResponse, UserProfile } from '@/types'
import { NextResponse }        from 'next/server'

export async function GET(): Promise<NextResponse<ApiResponse<UserProfile>>> {
  const limited = await checkRateLimit()
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, name, avatar_url')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json({
      data: {
        id:         user.id,
        name:       profile?.name ?? null,
        email:      user.email ?? '',
        avatar_url: profile?.avatar_url ?? null,
      },
      error: null,
    })
  } catch (err) {
    console.error('[GET /api/profile]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<UserProfile>>> {
  const limited = await checkRateLimit()
  if (limited) return limited

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const body   = await request.json()
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados inválidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    const { name, email } = parsed.data

    // Atualiza nome na tabela user_profiles
    if (name !== undefined) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, name, updated_at: new Date().toISOString() })

      if (profileError) throw profileError
    }

    // Atualiza e-mail no Supabase Auth (dispara e-mail de confirmação)
    if (email !== undefined && email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email })
      if (emailError) {
        return NextResponse.json({ data: null, error: emailError.message }, { status: 400 })
      }
    }

    // Retorna perfil atualizado
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, name, avatar_url')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      data: {
        id:         user.id,
        name:       profile?.name ?? null,
        email:      email ?? user.email ?? '',
        avatar_url: profile?.avatar_url ?? null,
      },
      error: null,
    })
  } catch (err) {
    console.error('[PATCH /api/profile]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
