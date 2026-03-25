/**
 * Gera ícones PNG para PWA e Apple Touch Icon a partir do asset JPEG principal.
 * Uso: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = resolve(__dirname, '..')
const src       = resolve(root, 'public', 'nos-dois-reais.jpeg')

const icons = [
  { file: 'icon-192.png',        size: 192 },
  { file: 'icon-512.png',        size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const { file, size } of icons) {
  const dest = resolve(root, 'public', file)
  await sharp(src)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(dest)
  console.log(`✓ public/${file} (${size}×${size})`)
}
