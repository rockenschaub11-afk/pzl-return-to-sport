// P2: Berichte – Pflichthinweise, Entwurf und der Name, der nie gespeichert werden darf.

import { expect, test } from '../fixtures/app'

const NAME = 'Testname E2E'

test.describe('Berichte', () => {
  test('Arzt- und Pat.-Bericht einer offenen Testung: Entwurf und „ersetzt keine ärztliche Freigabe“', async ({ app, page }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-BERICHT' })
    await testung.koerpergewicht('80')
    await testung.gespeichert()
    const id = testung.id
    for (const [art, name] of [
      ['arzt', 'Arztbericht'],
      ['pat', 'Pat./Trainer-Bericht'],
    ] as const) {
      await app.oeffne(`/berichte/${id}/${art}`)
      const bericht = page.getByRole('article', { name })
      await expect(bericht).toContainText('ENTWURF – Testung nicht abgeschlossen')
      await expect(bericht).toContainText(/ersetzt keine ärztliche Freigabe/i)
      await expect(bericht).toContainText('E2E-BERICHT')
      await expect(bericht).toContainText('15.06.2026')
    }
  })

  test('der Name steht nur im Ausdruck – nicht im Speicher und nach dem Verlassen weg', async ({ app, page }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-NAME' })
    await testung.gespeichert()
    const id = testung.id
    await app.oeffne(`/berichte/${id}/arzt`)
    await page.getByLabel(/Name für den Ausdruck/).fill(NAME)
    await expect(page.getByRole('article', { name: 'Arztbericht' })).toContainText(NAME)
    // Dateiname beim Speichern als PDF = Seitentitel: nur Kürzel, nie der Name
    await expect(page).toHaveTitle('Arztbericht E2E-NAME 2026-06-15')

    // gesamten Browser-Speicher der App durchsuchen
    const gespeichert = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((ok, fehler) => {
        const r = indexedDB.open('pzl-return-to-sport')
        r.onsuccess = () => ok(r.result)
        r.onerror = () => fehler(r.error)
      })
      const alles: unknown[] = []
      for (const tabelle of Array.from(db.objectStoreNames)) {
        alles.push(
          await new Promise((ok) => {
            const r = db.transaction(tabelle).objectStore(tabelle).getAll()
            r.onsuccess = () => ok(r.result)
          }),
        )
      }
      db.close()
      return JSON.stringify(alles) + JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })
    })
    expect(gespeichert).toContain('E2E-NAME')
    expect(gespeichert).not.toContain(NAME)

    await app.oeffne('/berichte')
    await app.oeffne(`/berichte/${id}/arzt`)
    await expect(page.getByLabel(/Name für den Ausdruck/)).toHaveValue('')
    await expect(page.getByRole('article', { name: 'Arztbericht' })).not.toContainText(NAME)
  })

  test('Berichte-Liste findet die Testung über die Suche', async ({ app, page }) => {
    await app.neueTestung({ kuerzel: 'E2E-SUCHE' })
    await app.oeffne('/berichte')
    await page.getByPlaceholder('Kürzel suchen …').fill('e2e-su')
    await expect(page.getByRole('row', { name: /E2E-SUCHE/ })).toBeVisible()
    await page.getByPlaceholder('Kürzel suchen …').fill('XYZ')
    await expect(page.getByRole('row', { name: /E2E-SUCHE/ })).toHaveCount(0)
  })
})
