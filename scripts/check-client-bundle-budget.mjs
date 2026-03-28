import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const chunksDir = path.join(projectRoot, '.next', 'static', 'chunks')
const layoutBudgetKb = Number(process.env.LAYOUT_JS_BUDGET_KB ?? 650)
const routeBudgetKb = Number(process.env.ROUTE_JS_BUDGET_KB ?? 340)

if (!fs.existsSync(chunksDir)) {
  console.error('[bundle-budget] .next/static/chunks nao encontrado. Rode `npm run build` antes.')
  process.exit(1)
}

function listFilesRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const resolved = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(resolved))
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(resolved)
    }
  }
  return files
}

const allJsFiles = listFilesRecursively(chunksDir)
const allJs = allJsFiles.map((filePath) => ({
  filePath,
  relPath: path.relative(chunksDir, filePath).replaceAll(path.sep, '/'),
  size: fs.statSync(filePath).size,
}))

const layoutChunk = allJs.find((f) => /^app\/layout(?:-[^/]+)?\.js$/.test(f.relPath))
if (!layoutChunk) {
  console.error('[bundle-budget] chunk app/layout.js nao encontrado.')
  process.exit(1)
}

const routeChunks = allJs
  .filter((f) => {
    if (!f.relPath.startsWith('app/')) return false
    if (/^app\/layout(?:-[^/]+)?\.js$/.test(f.relPath)) return false
    return true
  })
  .sort((a, b) => b.size - a.size)

const largestRouteChunk = routeChunks[0]
const layoutSizeKb = layoutChunk.size / 1024
const routeSizeKb = largestRouteChunk ? largestRouteChunk.size / 1024 : 0

console.log(`[bundle-budget] app/layout.js: ${layoutSizeKb.toFixed(1)} KB (budget: ${layoutBudgetKb} KB)`)
if (largestRouteChunk) {
  console.log(`[bundle-budget] maior chunk de rota: ${largestRouteChunk.relPath} -> ${routeSizeKb.toFixed(1)} KB (budget: ${routeBudgetKb} KB)`)
}

console.log('[bundle-budget] Top 10 chunks de rota:')
for (const chunk of routeChunks.slice(0, 10)) {
  console.log(` - ${chunk.relPath} -> ${(chunk.size / 1024).toFixed(1)} KB`)
}

let failed = false
if (layoutSizeKb > layoutBudgetKb) {
  console.error(`[bundle-budget] Falhou: app/layout.js acima do budget por ${(layoutSizeKb - layoutBudgetKb).toFixed(1)} KB.`)
  failed = true
}
if (largestRouteChunk && routeSizeKb > routeBudgetKb) {
  console.error(`[bundle-budget] Falhou: maior chunk de rota acima do budget por ${(routeSizeKb - routeBudgetKb).toFixed(1)} KB.`)
  failed = true
}

if (failed) {
  process.exit(1)
}

console.log('[bundle-budget] OK: dentro do orçamento definido.')
