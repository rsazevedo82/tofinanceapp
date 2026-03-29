import type { NextResponse } from 'next/server'
import { z } from 'zod'
import { fail, logInternalError, ok } from '@/lib/apiResponse'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

const sessionSchema = z.object({
  access_token: z.string().min(1, 'access_token obrigatorio'),
  refresh_token: z.string().min(1, 'refresh_token obrigatorio'),
})

type SessionResponse = { success: true }

export async function POST(request: Request): Promise<NextResponse<ApiResponse<SessionResponse>>> {
  try {
    const body = await request.json()
    const parsed = sessionSchema.safeParse(body)

    if (!parsed.success) {
      return fail(400, 'Dados invalidos')
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.setSession({
      access_token: parsed.data.access_token,
      refresh_token: parsed.data.refresh_token,
    })

    if (error) {
      return fail(401, 'Sessao invalida')
    }

    return ok({ success: true })
  } catch (err) {
    logInternalError('POST /api/auth/session', err)
    return fail(500, 'Erro interno')
  }
}

