# ============================================================
# aplicar-bloco1.ps1
# Salve em: E:\MyProjects\tofinanceapp\aplicar-bloco1.ps1
# Execute:  .\aplicar-bloco1.ps1
# ============================================================

$origem  = "G:\Meu Drive\Robson\meus-projetos\finapp"
$destino = "E:\MyProjects\tofinanceapp"

Write-Host ""
Write-Host "==> Origem : $origem"  -ForegroundColor Cyan
Write-Host "==> Destino: $destino" -ForegroundColor Cyan
Write-Host ""

# Valida pastas
if (-not (Test-Path $origem)) {
    Write-Host "ERRO: Pasta de origem nao encontrada: $origem" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $destino)) {
    Write-Host "ERRO: Pasta do projeto nao encontrada: $destino" -ForegroundColor Red
    exit 1
}

# Mapeamento: nome do arquivo na origem => caminho relativo no projeto
$arquivos = [ordered]@{
    "001_accounts_categories_full.sql"    = "supabase\migrations\001_accounts_categories_full.sql"
    "lib.validations.schemas.ts"          = "lib\validations\schemas.ts"
    "api.accounts.route.ts"               = "app\api\accounts\route.ts"
    "api.accounts.[id].route.ts"          = "app\api\accounts\[id]\route.ts"
    "api.categories.route.ts"             = "app\api\categories\route.ts"
    "api.categories.[id].route.ts"        = "app\api\categories\[id]\route.ts"
    "hooks.useAccounts.ts"                = "hooks\useAccounts.ts"
    "hooks.useCategories.ts"              = "hooks\useCategories.ts"
    "components.finance.AccountForm.tsx"  = "components\finance\AccountForm.tsx"
    "components.finance.CategoryForm.tsx" = "components\finance\CategoryForm.tsx"
    "dashboard.contas.page.tsx"           = "app\(dashboard)\contas\page.tsx"
    "dashboard.categorias.page.tsx"       = "app\(dashboard)\categorias\page.tsx"
}

$ok    = 0
$erros = 0

foreach ($entrada in $arquivos.GetEnumerator()) {

    $nomeOrigem = $entrada.Key
    $relDestino = $entrada.Value

    $src = Join-Path $origem  $nomeOrigem
    $dst = Join-Path $destino $relDestino

    if (-not (Test-Path $src)) {
        Write-Host "  ERRO  nao encontrado: $nomeOrigem" -ForegroundColor Red
        $erros++
        continue
    }

    $pasta = Split-Path $dst
    if (-not (Test-Path $pasta)) {
        New-Item -ItemType Directory -Path $pasta -Force | Out-Null
        Write-Host "  pasta criada: $pasta" -ForegroundColor DarkGray
    }

    if (Test-Path $dst) {
        Copy-Item $dst "$dst.bak" -Force
        Write-Host "  bak   $relDestino" -ForegroundColor DarkGray
    }

    Copy-Item $src $dst -Force
    Write-Host "  ok    $relDestino" -ForegroundColor Green
    $ok++
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor DarkGray

if ($erros -gt 0) {
    Write-Host "$ok copiado(s)  |  $erros com erro" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Arquivos com erro nao foram encontrados em:" -ForegroundColor Yellow
    Write-Host "  $origem" -ForegroundColor Yellow
    Write-Host "Verifique se todos os arquivos foram salvos la." -ForegroundColor Yellow
} else {
    Write-Host "$ok arquivo(s) copiado(s) com sucesso." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor White
    Write-Host ""
    Write-Host "  1. Execute o SQL no Supabase (cole o conteudo no SQL Editor):" -ForegroundColor Gray
    Write-Host "     $origem\001_accounts_categories_full.sql" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  2. Inicie o servidor de desenvolvimento:" -ForegroundColor Gray
    Write-Host "     npm run dev" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  3. Teste as paginas:" -ForegroundColor Gray
    Write-Host "     http://localhost:3000/contas" -ForegroundColor DarkGray
    Write-Host "     http://localhost:3000/categorias" -ForegroundColor DarkGray
}
Write-Host ""