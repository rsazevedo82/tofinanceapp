import { expect, test, type Page } from '@playwright/test'

async function waitForServiceWorker(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return
    await navigator.serviceWorker.ready
  })
}

test.describe('PWA', () => {
  test('deve registrar service worker e expor metadados de instalacao', async ({ page }) => {
    await page.goto('/login')
    await waitForServiceWorker(page)

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
        expect.objectContaining({ src: '/icons/icon-192.png' }),
        expect.objectContaining({ src: '/icons/icon-512.png' }),
      ]),
    )
  })

  test('deve cair no fallback offline em navegacao sem rede', async ({ page, context }) => {
    await page.goto('/login')
    await waitForServiceWorker(page)

    await context.setOffline(true)
    await page.goto(`/rota-offline-teste-${Date.now()}`, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Você está offline' })).toBeVisible()
    await expect(page.getByText('Verifique sua conexão e tente novamente.')).toBeVisible()
    await context.setOffline(false)
  })

  test('deve manter API como network-only no service worker', async ({ page }) => {
    await page.goto('/login')
    const swSource = await page.evaluate(async () => {
      const res = await fetch('/sw.js')
      return res.text()
    })

    expect(swSource).toContain('registerRoute(/^\\/api\\//,new e.NetworkOnly')
    expect(swSource).not.toContain("cacheName:'api-cache'")
    expect(swSource).not.toContain('cacheName:"api-cache"')
  })
})
