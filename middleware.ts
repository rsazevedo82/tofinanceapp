import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://tofinanceapp.vercel.app',
  'http://localhost:3000',
]

function csrfProtection(request: NextRequest): NextResponse | null {
  const method = request.method
  const isMutating = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  if (!isMutating || !isApiRoute) return null

  const origin = request.headers.get('origin')

  // Sem origin header — requisição server-side ou curl direto
  // Permite, pois não é um browser fazendo cross-site
  if (!origin) return null

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { data: null, error: 'Origem não autorizada' },
      { status: 403 }
    )
  }

  return null
}

export async function middleware(request: NextRequest) {
  // CSRF check antes de qualquer outra coisa
  const csrfError = csrfProtection(request)
  if (csrfError) return csrfError

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Rotas de API retornam 401 pelo próprio handler
  if (path.startsWith('/api/')) {
    return supabaseResponse
  }

  const publicRoutes = ['/login', '/cadastro']
  const isPublicRoute = publicRoutes.includes(path)

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}