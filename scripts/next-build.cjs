const { spawnSync } = require('node:child_process')
const path = require('node:path')

const nextPkg = require('next/package.json')
const major = Number.parseInt(String(nextPkg.version).split('.')[0], 10)

const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next')
const args = ['build']

// Next 16 ativa Turbopack por padrão e exige flag explícita
// quando existe configuração webpack/plugin legado (ex: next-pwa).
if (Number.isFinite(major) && major >= 16) {
  args.push('--webpack')
}

const child = spawnSync(process.execPath, [nextBin, ...args], {
  stdio: 'inherit',
  env: process.env,
})

if (child.error) {
  console.error(child.error)
  process.exit(1)
}

process.exit(child.status ?? 1)
