// P1: Speichern, Abschluss und derselbe Wert in allen Modulen (Testkarte → Kürzel-Seite → Berichte → Liste).

import { expect, HEUTE, test } from '../fixtures/app'
import { TestungSeite } from '../seiten/testung'

const KNIE_EXT = 'hhd_knie_ext'

test.describe('Speichern', () => {
  test('Eingaben bleiben nach dem Neuladen erhalten', async ({ app, page }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-LADEN' })
    await testung.koerpergewicht('80')
    await testung.versuche(KNIE_EXT, 'gesund', ['100'])
    await testung.versuche(KNIE_EXT, 'betroffen', ['80'])
    await testung.gespeichert()
    await page.reload()
    await expect(page.getByPlaceholder('z. B. 72,5')).toHaveValue('80')
    await expect(testung.kriterium(KNIE_EXT, 'LSI').locator('.kriterium-wert')).toHaveText('80,0 %')
  })

  test('abgeschlossene Testung ist schreibgeschützt und lässt sich wieder öffnen', async ({ app, page }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-ABSCHL' })
    await testung.koerpergewicht('80')
    await page.getByLabel('Vorschlag bestätigt').check()
    await page.getByLabel(/Therapeut:in \(Kürzel\)/).fill('E2E')
    await page.getByRole('button', { name: 'Testung abschließen' }).click()
    await expect(page.getByText('Abgeschlossen am 15.06.2026 – schreibgeschützt.', { exact: false })).toBeVisible()
    await expect(page.getByPlaceholder('z. B. 72,5')).toBeDisabled()
    await testung.gespeichert()

    await page.getByRole('button', { name: 'Wieder öffnen …' }).click()
    await page.getByRole('button', { name: 'Ja, wieder öffnen' }).click()
    await expect(page.getByPlaceholder('z. B. 72,5')).toBeEnabled()
  })

  test('ein zweites Fenster mit altem Stand überschreibt nichts', async ({ app, page, context }) => {
    const a = await app.neueTestung({ kuerzel: 'E2E-ZWEI' })
    const seiteB = await context.newPage()
    await seiteB.clock.setFixedTime(HEUTE)
    await seiteB.goto(page.url())
    const b = new TestungSeite(seiteB, 'links')
    await expect(seiteB.getByPlaceholder('z. B. 72,5')).toBeVisible()

    await a.koerpergewicht('81')
    await a.gespeichert()
    await b.koerpergewicht('66')
    await expect(seiteB.getByRole('alert')).toContainText('in einem anderen Fenster geändert')
    await expect(b.speicherstand()).toHaveText('! nicht gespeichert – anderes Fenster')

    // Fenster A sieht nach dem Neuladen weiter den eigenen Wert
    await page.reload()
    await expect(page.getByPlaceholder('z. B. 72,5')).toHaveValue('81')
    // Fenster B übernimmt auf Wunsch den aktuellen Stand und speichert danach wieder
    await seiteB.getByRole('button', { name: 'Aktuellen Stand laden' }).click()
    await expect(seiteB.getByPlaceholder('z. B. 72,5')).toHaveValue('81')
    await b.koerpergewicht('79')
    await b.gespeichert()
  })
})

test.describe('Datenfluss zwischen den Modulen', () => {
  test('derselbe LSI steht in Testkarte, „Was fehlt noch?“, Kürzel-Seite, Arzt- und Pat.-Bericht', async ({ app, page }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-FLUSS' })
    await testung.versuche(KNIE_EXT, 'gesund', ['100'])
    await testung.versuche(KNIE_EXT, 'betroffen', ['80'])
    await testung.gespeichert()
    const id = testung.id
    const satz = 'Knie-Extension (HHD, sitzend): LSI 80,0 % – Ziel ≥ 90 %'

    await expect(testung.kriterium(KNIE_EXT, 'LSI').locator('.kriterium-wert')).toHaveText('80,0 %')
    await expect(page.locator('#ergebnis')).toContainText(satz)

    await app.kuerzelSeite('E2E-FLUSS')
    // Seitenvergleich zeigt eine Nachkommastelle nur, wenn sie nicht 0 ist („80 %“)
    await expect(page.getByRole('img', { name: /^LSI je Test:/ })).toHaveAttribute('aria-label', /Knie-Extension \(HHD\) 80 % ~/)

    await app.oeffne(`/berichte/${id}/arzt`)
    const arzt = page.getByRole('article', { name: 'Arztbericht' })
    await expect(arzt).toContainText(satz)
    await expect(arzt.getByRole('img', { name: /^LSI je Test:/ })).toHaveAttribute('aria-label', /Knie-Extension \(HHD\) 80 % ~/)

    await app.oeffne(`/berichte/${id}/pat`)
    const pat = page.getByRole('article', { name: 'Pat./Trainer-Bericht' })
    await expect(pat).toContainText('das betroffene Bein schafft 80,0 % des gesunden – Ziel: mindestens 90 %')
    await expect(pat).toContainText('gesund 100 kg · betroffen 80 kg')
  })

  test('Pflicht-Stand in der Pat.-Liste passt zum Pat.-Bericht', async ({ app, page }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-PFLICHT' })
    await testung.versuche(KNIE_EXT, 'gesund', ['100'])
    await testung.versuche(KNIE_EXT, 'betroffen', ['95'])
    await testung.gespeichert()
    const id = testung.id

    await app.oeffne(`/berichte/${id}/pat`)
    const text = await page.getByRole('article', { name: 'Pat./Trainer-Bericht' }).innerText()
    const [, erreicht, gesamt] = text.match(/Schon erreicht:\s*(\d+) von (\d+)\s*Pflicht-Zielen/) ?? []
    expect(gesamt, 'Pat.-Bericht nennt die Pflicht-Ziele').toBeTruthy()

    await app.oeffne('/patienten')
    await expect(page.getByRole('row', { name: /E2E-PFLICHT/ })).toContainText(`${erreicht} / ${gesamt}`)
  })
})

test.describe('Phase und Zeitkriterium aus dem OP-Datum', () => {
  test('8 Monate nach OP: Endtestung „Return to Training“, Zeit noch nicht erfüllt', async ({ app, page }) => {
    await app.neueTestung({ kuerzel: 'E2E-8MO', opDatum: '2025-10-01' })
    await expect(page.getByText('Phase: Return to Training (8–9 Monate)')).toBeVisible()
    await expect(page.locator('#ergebnis')).toContainText('Zeit seit OP: 8 Monate – mindestens 9 Monate')
  })

  test('12 Monate nach OP: Endtestung „Return to Competition“, Zeit erfüllt', async ({ app, page }) => {
    await app.neueTestung({ kuerzel: 'E2E-12MO', opDatum: '2025-06-01' })
    await expect(page.getByText('Phase: Return to Competition (> 9 Monate)')).toBeVisible()
    await expect(page.getByText('Zeit: 12 Monate (mind. 9)')).toBeVisible()
    await expect(page.locator('#ergebnis')).not.toContainText('Zeit seit OP')
  })

  test('4 Monate nach OP: Verlaufstest ohne RTS-Vorschlag', async ({ app, page }) => {
    await app.neueTestung({ kuerzel: 'E2E-4MO', opDatum: '2026-02-10' })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Verlaufstest E2E-4MO')
    await expect(page.getByText('Phase: Mitte (3–5 Monate)')).toBeVisible()
    await expect(page.getByText('Kriterien (noch) nicht erfüllt')).toHaveCount(0)
  })
})
