import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const targets = ['app/api', 'lib']
const allowedFiles = new Set([
  path.normalize('lib/supabase/admin.ts'),
  path.normalize('lib/privileged/auditAdmin.ts'),
  path.normalize('lib/privileged/coupleAdmin.ts'),
  path.normalize('lib/privileged/notificationsAdmin.ts'),
])
const importPattern = /from\s+['"]@\/lib\/supabase\/admin['"]/

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, out)
      continue
    }
    if (entry.isFile() && /\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

const violations = []

for (const target of targets) {
  const absTarget = path.join(root, target)
  if (!fs.existsSync(absTarget)) continue

  const files = walk(absTarget)
  for (const file of files) {
    const rel = path.normalize(path.relative(root, file))
    if (allowedFiles.has(rel)) continue

    const source = fs.readFileSync(file, 'utf8')
    if (importPattern.test(source)) {
      violations.push(rel)
    }
  }
}

if (violations.length > 0) {
  console.error('[service-role-check] Import direto de adminClient fora da camada privilegiada:')
  for (const file of violations) {
    console.error(` - ${file}`)
  }
  console.error('[service-role-check] Use funções em lib/privileged/* para operações com service_role.')
  process.exit(1)
}

console.log('[service-role-check] OK: uso de service_role restrito à camada privilegiada.')
