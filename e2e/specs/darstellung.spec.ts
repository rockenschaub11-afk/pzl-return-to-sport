// P3: Darstellung auf Handy, Tablet und Laptop – mit dem Beispiel-Pat. der App (DEMO-1990, über „Einstellungen/Info“ angelegt).

import { expect, test } from '../fixtures/app'
import type { App } from '../fixtures/app'

const GROESSEN = [
  { name: 'Handy', width: 390, height: 844 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Laptop', width: 1440, height: 900 },
] as const

/** Beispiel-Pat. über den Knopf der App anlegen; endet auf dessen Kürzel-Seite */
async function beispiel(app: App): Promise<string> {
  await app.oeffne('/info')
  await app.page.getByRole('button', { name: 'Beispiel-Pat. anlegen' }).click()
  await expect(app.page.getByRole('heading', { level: 1, name: 'DEMO-1990' })).toBeVisible()
  return app.page.url()
}

const kippt = (app: App) => app.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

for (const g of GROESSEN) {
  test.describe(g.name, () => {
    test.use({ viewport: { width: g.width, height: g.height } })

    test(`kein waagrechtes Scrollen auf den Hauptseiten (${g.width} px)`, async ({ app, page }) => {
      const kuerzelSeite = await beispiel(app)
      expect(await kippt(app), 'Kürzel-Seite').toBeLessThanOrEqual(0)
      await page.getByRole('link', { name: 'Zur Testung' }).click()
      await expect(page.getByRole('heading', { level: 1 })).toContainText('DEMO-1990')
      expect(await kippt(app), 'Testung').toBeLessThanOrEqual(0)
      for (const pfad of ['/', '/patienten', '/berichte', '/sicherung', '/info']) {
        await app.oeffne(pfad)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        expect(await kippt(app), pfad).toBeLessThanOrEqual(0)
      }
      await page.goto(kuerzelSeite)
      await expect(page.getByRole('heading', { level: 1, name: 'DEMO-1990' })).toBeVisible()
    })

    test(`Navigation ist erreichbar (${g.width} px)`, async ({ app, page }) => {
      await app.oeffne('/patienten')
      const leiste = page.getByRole('navigation').first()
      await expect(leiste.getByRole('link', { name: 'Testung', exact: true })).toBeVisible()
      await leiste.getByRole('link', { name: 'Berichte', exact: true }).click()
      await expect(page).toHaveURL(/#\/berichte$/)
    })
  })
}

test('Pat./Trainer-Bericht der Endtestung passt auf eine A4-Seite', async ({ app, page }) => {
  await beispiel(app)
  await page.getByRole('link', { name: 'Bericht', exact: true }).first().click()
  await page.getByRole('link', { name: 'Pat./Trainer-Bericht' }).click()
  await expect(page.getByRole('article', { name: 'Pat./Trainer-Bericht' })).toBeVisible()
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true })
  const seiten = pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length ?? 0
  expect(seiten).toBe(1)
})
