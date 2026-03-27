// app/api/auth/logout/route.ts
import { createClient }  from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'
import type { ApiResponse } from '@/types'

export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) {
      return NextResponse.json({ data: null, error: 'Nao foi possivel encerrar a sessao' }, { status: 500 })
    }
    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[POST /api/auth/logout]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
