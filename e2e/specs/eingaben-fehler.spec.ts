// P2: fehlende, ungültige und unerwartete Eingaben – die App darf nichts Falsches rechnen und nicht abstürzen.

import { expect, test } from '../fixtures/app'

const KNIE_EXT = 'hhd_knie_ext'

test.describe('Messwerte', () => {
  test('Text statt Zahl wird markiert und nicht gerechnet', async ({ app }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-ABC' })
    await testung.versuche(KNIE_EXT, 'gesund', ['100'])
    await testung.versuche(KNIE_EXT, 'betroffen', ['abc'])
    const karte = testung.karte(KNIE_EXT)
    await expect(karte.getByRole('alert')).toHaveText('keine Zahl')
    await expect(karte.getByLabel(`${testung.zeilenname('betroffen')} Versuch 1`, { exact: true })).toHaveAttribute('aria-invalid', 'true')
    await expect(testung.kriterium(KNIE_EXT, 'LSI').locator('.kriterium-wert')).toHaveText('–')
  })

  test('Komma und Punkt ergeben denselben Wert', async ({ app }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-PUNKT' })
    await testung.versuche(KNIE_EXT, 'gesund', ['100'])
    await testung.versuche(KNIE_EXT, 'betroffen', ['80.5'])
    await expect(testung.kriterium(KNIE_EXT, 'LSI').locator('.kriterium-wert')).toHaveText('80,5 %')
    await testung.versuche(KNIE_EXT, 'betroffen', ['80,5'])
    await expect(testung.kriterium(KNIE_EXT, 'LSI').locator('.kriterium-wert')).toHaveText('80,5 %')
  })

  test('nur eine Seite gemessen: kein LSI, Kriterium bleibt offen', async ({ app }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-EINS' })
    await testung.versuche(KNIE_EXT, 'gesund', ['100'])
    const lsi = testung.kriterium(KNIE_EXT, 'LSI')
    await expect(lsi.locator('.kriterium-wert')).toHaveText('–')
    await expect(lsi.locator('.kriterium-ampel')).toHaveText('offen')
  })

  test('gesunde Seite 0: kein LSI und kein Absturz', async ({ app, page }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-NULL' })
    await testung.versuche(KNIE_EXT, 'gesund', ['0'])
    await testung.versuche(KNIE_EXT, 'betroffen', ['80'])
    await expect(testung.kriterium(KNIE_EXT, 'LSI').locator('.kriterium-wert')).toHaveText('–')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('E2E-NULL')
  })

  test('ohne Körpergewicht kein N/kg, dafür ein Hinweis', async ({ app, page }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-OHNEKG' })
    await testung.versuche(KNIE_EXT, 'gesund', ['100'])
    await testung.versuche(KNIE_EXT, 'betroffen', ['80'])
    await expect(testung.kriterium(KNIE_EXT, 'Kraft relativ').locator('.kriterium-wert')).toHaveText('–')
    await expect(page.getByText('Ohne Körpergewicht keine N/kg- und Ns/kg-Werte.')).toBeVisible()
  })
})

test.describe('Kürzel-Formular', () => {
  const fehlerBeimSpeichern = async (app: import('../fixtures/app').App, kuerzel: string, opDatum = '2025-06-01') => {
    await app.oeffne('/patienten/neu')
    const page = app.page
    await page.getByPlaceholder('MH-1998').fill(kuerzel)
    await page.getByRole('group', { name: 'Betroffene Seite' }).getByRole('button', { name: 'Links' }).click()
    await page.getByRole('group', { name: 'Niveau' }).getByRole('button', { name: 'Wettkampf' }).click()
    await page.getByLabel('OP-Datum').fill(opDatum)
    await page.getByRole('button', { name: 'Speichern' }).click()
  }

  test('ein Kürzel gibt es nur einmal – auch in anderer Schreibweise', async ({ app, page }) => {
    await app.kuerzelAnlegen({ kuerzel: 'E2E-DOPPELT' })
    await fehlerBeimSpeichern(app, 'e2e-doppelt ')
    await expect(page.getByText('Das Kürzel E2E-DOPPELT gibt es schon.')).toBeVisible()
    await expect(page).toHaveURL(/#\/patienten\/neu$/)
  })

  test('zu lange Kürzel und Sonderzeichen werden abgelehnt', async ({ app, page }) => {
    await fehlerBeimSpeichern(app, 'E2E-VIEL-ZU-LANG')
    await expect(page.getByText('Höchstens 15 Zeichen – bitte nur ein Kürzel, keinen Namen.')).toBeVisible()
    await page.getByPlaceholder('MH-1998').fill('E2E_1')
    await expect(page.getByText('Nur Buchstaben, Ziffern und Bindestrich.')).toBeVisible()
  })

  test('OP-Datum in der Zukunft wird abgelehnt', async ({ app, page }) => {
    await fehlerBeimSpeichern(app, 'E2E-ZUKUNFT', '2026-07-01')
    await expect(page.getByText('Das Datum liegt in der Zukunft.')).toBeVisible()
  })

  test('ohne Pflichtangaben wird nicht gespeichert', async ({ app, page }) => {
    await app.oeffne('/patienten/neu')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Bitte ein Kürzel eingeben, z. B. MH-1998.')).toBeVisible()
    await expect(page.getByText('Bitte die betroffene Seite wählen.')).toBeVisible()
    await expect(page.getByText('Bitte das OP-Datum eingeben.')).toBeVisible()
    await app.oeffne('/patienten')
    await expect(page.getByText('Noch keine Kürzel angelegt')).toBeVisible()
  })
})
