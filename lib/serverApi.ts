import { cookies, headers } from 'next/headers'
import type { ApiResponse } from '@/types'

async function resolveBaseUrl() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'

  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (!host) throw new Error('Não foi possível resolver host para chamadas internas de API.')
  return `${proto}://${host}`
}

export async function fetchServerApi<T>(path: string): Promise<T> {
  const baseUrl = await resolveBaseUrl()
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: 'no-store',
  })

  const json: ApiResponse<T> = await res.json()

  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Falha ao buscar ${path}`)
  }

  if (json.data == null) {
    throw new Error(`Resposta sem dados em ${path}`)
  }

  return json.data
}
