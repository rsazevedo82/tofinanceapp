// app/api/couple/route.ts

import { createClient }                              from '@/lib/supabase/server'
import { adminClient }                               from '@/lib/supabase/admin'
import { NextResponse }                              from 'next/server'
import type { ApiResponse, CoupleProfile, UserProfile } from '@/types'

// ── GET /api/couple ───────────────────────────────────────────────────────────
// Retorna o vínculo ativo do usuário + perfil do parceiro

export async function GET(): Promise<NextResponse<ApiResponse<CoupleProfile | null>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { data: couple, error } = await supabase
      .from('couple_profiles')
      .select('*')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .maybeSingle()

    if (error) throw error
    if (!couple) return NextResponse.json({ data: null, error: null })

    // Busca perfil do parceiro
    const partnerId = couple.user_id_1 === user.id ? couple.user_id_2 : couple.user_id_1
    const { data: partnerProfile } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('id', partnerId)
      .maybeSingle()

    // Busca email do parceiro via admin
    const { data: { user: partnerAuth } } = await adminClient.auth.admin.getUserById(partnerId)

    const partner: UserProfile = {
      id:         partnerId,
      name:       partnerProfile?.name ?? partnerAuth?.email?.split('@')[0] ?? 'Parceiro',
      avatar_url: partnerProfile?.avatar_url ?? null,
      updated_at: partnerProfile?.updated_at ?? couple.created_at,
    }

    return NextResponse.json({ data: { ...couple, partner }, error: null })
  } catch (err) {
    console.error('[GET /api/couple]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

// ── DELETE /api/couple ────────────────────────────────────────────────────────
// Desvincula casal. Requer confirmação de senha no body.

export async function DELETE(request: Request): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { password } = await request.json()
    if (!password) {
      return NextResponse.json({ data: null, error: 'Senha obrigatória para desvincular' }, { status: 400 })
    }

    // Valida senha re-autenticando
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    user.email!,
      password,
    })
    if (signInError) {
      return NextResponse.json({ data: null, error: 'Senha incorreta' }, { status: 403 })
    }

    // Busca o vínculo
    const { data: couple, error: coupleError } = await adminClient
      .from('couple_profiles')
      .select('*')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .maybeSingle()

    if (coupleError) throw coupleError
    if (!couple) {
      return NextResponse.json({ data: null, error: 'Nenhum vínculo ativo encontrado' }, { status: 404 })
    }

    const partnerId = couple.user_id_1 === user.id ? couple.user_id_2 : couple.user_id_1

    // Remove objetivos de casal (quando a Fase 3 for implementada)
    await adminClient
      .from('goals')
      .delete()
      .eq('couple_id', couple.id)
      .then(() => {}) // silencia se tabela ainda não existir

    // Remove o vínculo
    const { error: deleteError } = await adminClient
      .from('couple_profiles')
      .delete()
      .eq('id', couple.id)

    if (deleteError) throw deleteError

    // Cancela convites pendentes entre os dois
    await adminClient
      .from('couple_invitations')
      .update({ status: 'cancelled' })
      .or(`inviter_id.eq.${user.id},inviter_id.eq.${partnerId}`)
      .eq('status', 'pending')

    // Notifica ambos
    const now = new Date().toISOString()
    await adminClient.from('notifications').insert([
      {
        user_id:    user.id,
        type:       'couple_unlinked',
        title:      'Perfil de casal desvinculado',
        body:       'O vínculo de casal foi encerrado. Os objetivos compartilhados foram removidos.',
        payload:    {},
        created_at: now,
      },
      {
        user_id:    partnerId,
        type:       'couple_unlinked',
        title:      'Perfil de casal desvinculado',
        body:       'O vínculo de casal foi encerrado. Os objetivos compartilhados foram removidos.',
        payload:    {},
        created_at: now,
      },
    ])

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/couple]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
