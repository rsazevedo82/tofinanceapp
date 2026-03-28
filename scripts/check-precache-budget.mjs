import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const swPath = path.join(projectRoot, 'public', 'sw.js')
const defaultBudgetKb = 2500
const budgetKb = Number(process.env.PRECACHE_BUDGET_KB ?? defaultBudgetKb)

if (!Number.isFinite(budgetKb) || budgetKb <= 0) {
  console.error('[pwa-budget] PRECACHE_BUDGET_KB deve ser um numero positivo.')
  process.exit(1)
}

if (!fs.existsSync(swPath)) {
  console.error('[pwa-budget] public/sw.js nao encontrado. Rode `npm run build` antes deste check.')
  process.exit(1)
}

const swSource = fs.readFileSync(swPath, 'utf8')
const manifestMatch = swSource.match(/precacheAndRoute\((\[.*?\])\s*,\s*\{ignoreURLParametersMatching/s)

if (!manifestMatch) {
  console.error('[pwa-budget] Nao foi possivel localizar a lista de precache no service worker.')
  process.exit(1)
}

/** @type {{url: string, revision?: string}[]} */
const manifestEntries = Function(`"use strict"; return (${manifestMatch[1]});`)()

/** @type {{url: string, size: number, localPath: string}[]} */
const sizedEntries = []
/** @type {string[]} */
const missingEntries = []

for (const entry of manifestEntries) {
  const url = entry.url
  let localPath = null

  if (url.startsWith('/_next/static/')) {
    localPath = path.join(projectRoot, '.next', 'static', decodeURIComponent(url.replace('/_next/static/', '')))
  } else if (url.startsWith('/')) {
    localPath = path.join(projectRoot, 'public', decodeURIComponent(url.slice(1)))
  }

  if (!localPath || !fs.existsSync(localPath)) {
    missingEntries.push(url)
    continue
  }

  sizedEntries.push({
    url,
    size: fs.statSync(localPath).size,
    localPath,
  })
}

const totalBytes = sizedEntries.reduce((acc, item) => acc + item.size, 0)
const totalKb = totalBytes / 1024
const budgetBytes = budgetKb * 1024
const topHeavy = [...sizedEntries]
  .sort((a, b) => b.size - a.size)
  .slice(0, 10)

console.log(
  `[pwa-budget] Precache total: ${totalKb.toFixed(1)} KB (${sizedEntries.length}/${manifestEntries.length} entradas com arquivo local)`,
)
console.log(`[pwa-budget] Budget alvo: ${budgetKb} KB`)

if (missingEntries.length > 0) {
  console.log(`[pwa-budget] Entradas sem arquivo local (${missingEntries.length}):`)
  for (const url of missingEntries.slice(0, 10)) {
    console.log(` - ${url}`)
  }
}

console.log('[pwa-budget] Top 10 maiores arquivos de precache:')
for (const item of topHeavy) {
  console.log(` - ${item.url} -> ${(item.size / 1024).toFixed(1)} KB`)
}

if (totalBytes > budgetBytes) {
  const overByKb = (totalBytes - budgetBytes) / 1024
  console.error(`[pwa-budget] Falhou: acima do budget por ${overByKb.toFixed(1)} KB.`)
  process.exit(1)
}

console.log('[pwa-budget] OK: dentro do budget.')
