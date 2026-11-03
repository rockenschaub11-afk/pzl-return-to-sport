// P2: Sicherung – eine exportierte Kürzel-Datei bringt auf einem „anderen Laptop“ (frischer Speicher) dieselben Werte zurück.

import { HEUTE, expect, test } from '../fixtures/app'
import { App } from '../fixtures/app'
import { TestungSeite } from '../seiten/testung'

const PASSWORT = 'e2e-passwort-1'

test('Kürzel exportieren und auf einem frischen Laptop importieren: gleiche Werte, gleicher LSI', async ({ app, page, browser }, testInfo) => {
  test.setTimeout(90_000) // Verschlüsselung ist absichtlich langsam
  const testung = await app.neueTestung({ kuerzel: 'E2E-SICHER' })
  await testung.versuche('hhd_knie_ext', 'gesund', ['100'])
  await testung.versuche('hhd_knie_ext', 'betroffen', ['80'])
  await testung.gespeichert()

  await app.oeffne('/sicherung')
  const form = page.locator('form', { has: page.getByRole('heading', { name: /Kürzel/ }) })
  await form.getByRole('combobox').selectOption({ label: 'E2E-SICHER' })
  await form.getByLabel(/Passwort \(mind\. 8 Zeichen\)/).fill(PASSWORT)
  await form.getByLabel('Passwort wiederholen').fill(PASSWORT)
  const download = page.waitForEvent('download')
  await form.getByRole('button', { name: 'Datei für Kürzel herunterladen' }).click()
  const datei = testInfo.outputPath((await download).suggestedFilename())
  await (await download).saveAs(datei)
  expect(datei).toMatch(/PZL-E2E-SICHER-2026-06-15\.pzlrts$/)

  // „anderer Laptop“: neuer Browser-Kontext mit leerem Speicher
  const anderer = await browser.newContext({ locale: 'de-AT', timezoneId: 'Europe/Vienna', serviceWorkers: 'block', reducedMotion: 'reduce' })
  const seite = await anderer.newPage()
  await seite.clock.setFixedTime(HEUTE)
  const app2 = new App(seite)
  await app2.oeffne('/sicherung')
  await seite.locator('input[type=file]').setInputFiles(datei)
  await seite.getByLabel('Passwort der Datei').fill('falsches-passwort')
  await seite.getByRole('button', { name: 'Datei öffnen' }).click()
  await expect(seite.getByRole('alert')).toBeVisible({ timeout: 30_000 })

  await seite.getByLabel('Passwort der Datei').fill(PASSWORT)
  await seite.getByRole('button', { name: 'Datei öffnen' }).click()
  await seite.getByRole('button', { name: 'Kürzel übernehmen' }).click({ timeout: 30_000 })

  await app2.kuerzelSeite('E2E-SICHER')
  await seite.getByRole('tab', { name: 'Testungen' }).click()
  await seite.getByRole('link', { name: /Endtestung/ }).click()
  const importiert = new TestungSeite(seite, 'links')
  await expect(importiert.kriterium('hhd_knie_ext', 'LSI').locator('.kriterium-wert')).toHaveText('80,0 %')
  await anderer.close()
})
