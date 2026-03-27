// app/api/auth/logout/route.ts
import { createClient }  from '@/lib/supabase/server'
import type { NextResponse } from 'next/server'
import { fail, logInternalError, ok } from '@/lib/apiResponse'
import type { ApiResponse } from '@/types'

export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) {
      return fail(500, 'Nao foi possivel encerrar a sessao')
    }
    return ok(null)
  } catch (err) {
    logInternalError('POST /api/auth/logout', err)
    return fail(500, 'Erro interno')
  }
}
