// app/api/couple/route.ts

import { createClient }                              from '@/lib/supabase/server'
import { checkRateLimitByIP, checkRateLimitByUser } from '@/lib/apiHelpers'
import { withRouteObservability } from '@/lib/observability'
import { getRequestAuditMeta, recordAuditEvent }     from '@/lib/audit'
import {
  cancelPendingInvitesForUsers,
  deleteCoupleById,
  deleteGoalsByCoupleId,
  getActiveCoupleByUserId,
  getAuthUserById,
  getUserProfileById,
} from '@/lib/privileged/coupleAdmin'
import { insertAdminNotifications } from '@/lib/privileged/notificationsAdmin'
import { NextResponse }                              from 'next/server'
import type { ApiResponse, CoupleProfile, UserProfile } from '@/types'

// ── GET /api/couple ───────────────────────────────────────────────────────────
// Retorna o vínculo ativo do usuário + perfil do parceiro

export async function GET(request: Request): Promise<NextResponse<ApiResponse<CoupleProfile | null>>> {
  return withRouteObservability(request, {
    route: '/api/couple',
    operation: 'couple_get',
  }, async () => {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const { data: couple, error } = await getActiveCoupleByUserId(user.id)

    if (error) throw error
    if (!couple) return NextResponse.json({ data: null, error: null })

    // Busca perfil do parceiro
    const partnerId = couple.user_id_1 === user.id ? couple.user_id_2 : couple.user_id_1
    const { data: partnerProfile } = await getUserProfileById(partnerId)

    // Busca email do parceiro via admin
    const { data: { user: partnerAuth } } = await getAuthUserById(partnerId)

    const partner: UserProfile = {
      id:         partnerId,
      name:       partnerProfile?.name ?? partnerAuth?.email?.split('@')[0] ?? 'Parceiro',
      email:      partnerAuth?.email ?? '',
      avatar_url: partnerProfile?.avatar_url ?? null,
      updated_at: partnerProfile?.updated_at ?? couple.created_at,
    }

    return NextResponse.json({ data: { ...couple, partner }, error: null })
  }) as Promise<NextResponse<ApiResponse<CoupleProfile | null>>>
}

// ── DELETE /api/couple ────────────────────────────────────────────────────────
// Desvincula casal. Requer confirmação de senha no body.

export async function DELETE(request: Request): Promise<NextResponse<ApiResponse<null>>> {
  return withRouteObservability(request, {
    route: '/api/couple',
    operation: 'couple_delete',
  }, async () => {
    const limited = await checkRateLimitByIP('couple:write')
    if (limited) return limited as NextResponse<ApiResponse<null>>

    const auditMeta = await getRequestAuditMeta()
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      await recordAuditEvent({
        action: 'couple_unlink',
        status: 'failure',
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'unauthorized' },
      })
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }
    const userLimited = await checkRateLimitByUser('couple:write', user.id)
    if (userLimited) return userLimited as NextResponse<ApiResponse<null>>

    const { password } = await request.json()
    if (!password) {
      await recordAuditEvent({
        action: 'couple_unlink',
        status: 'failure',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'missing_password' },
      })
      return NextResponse.json({ data: null, error: 'Senha obrigatória para desvincular' }, { status: 400 })
    }

    // Valida senha re-autenticando
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    user.email!,
      password,
    })
    if (signInError) {
      await recordAuditEvent({
        action: 'couple_unlink',
        status: 'failure',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'invalid_password' },
      })
      return NextResponse.json({ data: null, error: 'Senha incorreta' }, { status: 403 })
    }

    // Busca o vínculo
    const { data: couple, error: coupleError } = await getActiveCoupleByUserId(user.id)

    if (coupleError) throw coupleError
    if (!couple) {
      await recordAuditEvent({
        action: 'couple_unlink',
        status: 'failure',
        userId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: auditMeta.ip,
        userAgent: auditMeta.userAgent,
        metadata: { reason: 'couple_not_found' },
      })
      return NextResponse.json({ data: null, error: 'Nenhum vínculo ativo encontrado' }, { status: 404 })
    }

    const partnerId = couple.user_id_1 === user.id ? couple.user_id_2 : couple.user_id_1

    // Remove objetivos de casal (quando a Fase 3 for implementada)
    await deleteGoalsByCoupleId(couple.id).then(() => {}) // silencia se tabela ainda não existir

    // Remove o vínculo
    const { error: deleteError } = await deleteCoupleById(couple.id)

    if (deleteError) throw deleteError

    // Cancela convites pendentes entre os dois
    await cancelPendingInvitesForUsers(user.id, partnerId)

    // Notifica ambos
    const now = new Date().toISOString()
    await insertAdminNotifications([
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

    await recordAuditEvent({
      action: 'couple_unlink',
      status: 'success',
      userId: user.id,
      targetType: 'couple_profile',
      targetId: couple.id,
      ip: auditMeta.ip,
      userAgent: auditMeta.userAgent,
      metadata: { partner_id: partnerId },
    })

    return NextResponse.json({ data: null, error: null })
  }) as Promise<NextResponse<ApiResponse<null>>>
}
