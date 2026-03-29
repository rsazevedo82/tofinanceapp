const { spawnSync } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')

const nextPkg = require('next/package.json')
const major = Number.parseInt(String(nextPkg.version).split('.')[0], 10)

const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next')
const args = ['build']
const middlewarePath = path.join(process.cwd(), 'middleware.ts')
const proxyPath = path.join(process.cwd(), 'proxy.ts')
const middlewareBackupPath = path.join(process.cwd(), '.middleware.next15.backup.ts')

// Next 16 ativa Turbopack por padrão e exige flag explícita
// quando existe configuração webpack/plugin legado (ex: next-pwa).
if (Number.isFinite(major) && major >= 16) {
  args.push('--webpack')
}

const shouldTemporarilyHideMiddleware =
  Number.isFinite(major) &&
  major >= 16 &&
  fs.existsSync(middlewarePath) &&
  fs.existsSync(proxyPath)

if (shouldTemporarilyHideMiddleware) {
  fs.renameSync(middlewarePath, middlewareBackupPath)
}

let child
try {
  child = spawnSync(process.execPath, [nextBin, ...args], {
    stdio: 'inherit',
    env: process.env,
  })
} finally {
  if (shouldTemporarilyHideMiddleware && fs.existsSync(middlewareBackupPath)) {
    fs.renameSync(middlewareBackupPath, middlewarePath)
  }
}

if (child.error) {
  console.error(child.error)
  process.exit(1)
}

process.exit(child.status ?? 1)
