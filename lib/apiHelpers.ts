// lib/apiHelpers.ts
import { ratelimit } from '@/lib/rateLimit'
import { headers }   from 'next/headers'
import { NextResponse } from 'next/server'

export async function getIP(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '127.0.0.1'
}

export async function checkRateLimit(): Promise<NextResponse<never> | null> {
  const { success } = await ratelimit.limit(await getIP())
  if (!success) {
    return NextResponse.json(
      { data: null, error: 'Muitas requisicoes. Tente novamente em 1 minuto.' },
      { status: 429 }
    ) as NextResponse<never>
  }
  return null
}