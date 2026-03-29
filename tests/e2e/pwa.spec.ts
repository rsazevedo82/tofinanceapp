import { expect, test, type Page } from '@playwright/test'

async function waitForServiceWorker(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return
    await navigator.serviceWorker.ready
  })
}

async function ensureServiceWorkerController(page: Page) {
  await waitForServiceWorker(page)
  const hasController = await page.evaluate(() => {
    if (!('serviceWorker' in navigator)) return false
    return !!navigator.serviceWorker.controller
  })

  if (!hasController) {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForServiceWorker(page)
  }
}

test.describe('PWA', () => {
  test('deve registrar service worker e expor metadados de instalacao', async ({ page }) => {
    await page.goto('/login')
    await ensureServiceWorkerController(page)

    const sw = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) {
        return { supported: false, hasController: false, scope: '' }
      }

      const reg = await navigator.serviceWorker.ready
      await reg.update()

      return {
        supported: true,
        hasController: !!navigator.serviceWorker.controller,
        scope: reg.scope,
      }
    })

    expect(sw.supported).toBeTruthy()
    expect(sw.scope).toContain('/')

    const manifest = await page.evaluate(async () => {
      const res = await fetch('/manifest.webmanifest')
      return res.json()
    })

    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/n2r-simbolo-principal-claro-V1.png' }),
      ]),
    )
  })

  test('deve cair no fallback offline em navegacao sem rede', async ({ page }) => {
    await page.goto('/login')
    await ensureServiceWorkerController(page)

    const swSource = await page.evaluate(async () => {
      const res = await fetch('/sw.js')
      return res.text()
    })

    expect(swSource).toContain('NavigationRoute')
    expect(swSource).toContain('createHandlerBoundToURL("/offline")')
    expect(swSource).toContain('/offline')
  })

  test('deve manter API como network-only no service worker', async ({ page }) => {
    await page.goto('/login')
    await ensureServiceWorkerController(page)
    const swSource = await page.evaluate(async () => {
      const res = await fetch('/sw.js')
      return res.text()
    })

    expect(swSource).toMatch(/registerRoute\([^)]*NetworkOnly/)
    expect(swSource).toContain('NetworkOnly')
    expect(swSource).not.toContain("cacheName:'api-cache'")
    expect(swSource).not.toContain('cacheName:"api-cache"')
  })
})
