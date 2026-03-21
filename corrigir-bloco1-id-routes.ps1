# ============================================================
# corrigir-bloco1-id-routes.ps1
# Cria os 2 arquivos com [id] que falharam por causa dos colchetes
# Salve em: E:\MyProjects\tofinanceapp\
# Execute:  .\corrigir-bloco1-id-routes.ps1
# ============================================================

$destino = "E:\MyProjects\tofinanceapp"

# ── accounts/[id]/route.ts ────────────────────────────────────────────────────

$accountIdRoute = @'
// app/api/accounts/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { updateAccountSchema } from '@/lib/validations/schemas'
import type { ApiResponse, Account } from '@/types'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Account>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateAccountSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados invalidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    const { data: existing, error: findError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ data: null, error: 'Conta nao encontrada' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('accounts')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[PATCH /api/accounts/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const { data: existing, error: findError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ data: null, error: 'Conta nao encontrada' }, { status: 404 })
    }

    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', params.id)
      .is('deleted_at', null)

    if (count && count > 0) {
      return NextResponse.json(
        { data: null, error: `Nao e possivel excluir: conta possui ${count} transacao(oes) ativa(s).` },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('accounts')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/accounts/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
'@

# ── categories/[id]/route.ts ──────────────────────────────────────────────────

$categoryIdRoute = @'
// app/api/categories/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { updateCategorySchema } from '@/lib/validations/schemas'
import type { ApiResponse, Category } from '@/types'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Category>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateCategorySchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Dados invalidos'
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    const { data: existing, error: findError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { data: null, error: 'Categoria nao encontrada ou nao pode ser editada.' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('categories')
      .update(parsed.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('[PATCH /api/categories/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Nao autorizado' }, { status: 401 })
    }

    const { data: existing, error: findError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { data: null, error: 'Categoria nao encontrada ou nao pode ser excluida.' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('[DELETE /api/categories/:id]', err)
    return NextResponse.json({ data: null, error: 'Erro interno' }, { status: 500 })
  }
}
'@

# ── Cria os arquivos diretamente no projeto ───────────────────────────────────

$pasta1 = "$destino\app\api\accounts\[id]"
$pasta2 = "$destino\app\api\categories\[id]"

if (-not (Test-Path $pasta1)) { New-Item -ItemType Directory -Path $pasta1 -Force | Out-Null }
if (-not (Test-Path $pasta2)) { New-Item -ItemType Directory -Path $pasta2 -Force | Out-Null }

Set-Content -Path "$pasta1\route.ts" -Value $accountIdRoute  -Encoding UTF8
Write-Host "  ok    app\api\accounts\[id]\route.ts" -ForegroundColor Green

Set-Content -Path "$pasta2\route.ts" -Value $categoryIdRoute -Encoding UTF8
Write-Host "  ok    app\api\categories\[id]\route.ts" -ForegroundColor Green

Write-Host ""
Write-Host "Pronto. Bloco 1 completo." -ForegroundColor Cyan
Write-Host ""