// app/api/couple/invite/received/route.ts
// GET → retorna convite pendente recebido pelo usuário autenticado.

import { createClient } from '@/lib/supabase/server'
import { getLatestReceivedPendingInvitation, getUserProfileNameById } from '@/lib/privileged/coupleAdmin'
import { NextResponse } from 'next/server'
import type { ApiResponse, CoupleInvitation } from '@/types'

type ReceivedInvitationPayload = {
  invitation: CoupleInvitation
  inviter_name: string | null
}

export async function GET(): Promise<NextResponse<ApiResponse<ReceivedInvitationPayload | null>>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }

    const normalizedEmail = user.email?.trim().toLowerCase()

    const { data: invitations, error: inviteError } = await getLatestReceivedPendingInvitation({
      userId: user.id,
      normalizedEmail,
    })

    if (inviteError) throw inviteError

    const invitation = invitations?.[0] ?? null
    if (!invitation) {
      return NextResponse.json({ data: null, error: null })
    }

    const { data: inviterProfile } = await getUserProfileNameById(invitation.inviter_id)

    return NextResponse.json({
      data: {
        invitation,
        inviter_name: inviterProfile?.name ?? null,
      },
      error: null,
    })
  } catch (err) {
    console.error('[GET /api/couple/invite/received]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
