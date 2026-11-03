// P2: Navigation, Seitenwechsel, Adressen und die Rückfrage bei ungespeicherten Änderungen.

import { expect, test } from '../fixtures/app'

test.describe('Navigation', () => {
  test('jeder Eintrag der Seitenleiste führt zu seiner Seite', async ({ app, page }) => {
    await app.oeffne('/patienten')
    const leiste = page.getByRole('navigation').first()
    for (const [name, adresse] of [
      ['Testung', /#\/testung$/],
      ['Berichte', /#\/berichte$/],
      ['Sicherung', /#\/sicherung$/],
      ['Einstellungen/Info', /#\/info$/],
      ['Pat.-Liste', /#\/patienten$/],
      ['Start', /#\/$/],
    ] as const) {
      await leiste.getByRole('link', { name, exact: true }).click()
      await expect(page).toHaveURL(adresse)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      if (name !== 'Start') await expect(leiste.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page')
    }
  })

  test('eine unbekannte Adresse führt zur Startseite', async ({ app, page }) => {
    await app.oeffne('/gibt-es-nicht')
    await expect(page).toHaveURL(/#\/$/)
    await expect(page.getByRole('heading', { level: 1, name: 'PZL Return-to-Sport' })).toBeVisible()
  })

  test('Reiter der Kürzel-Seite: per Klick, per Pfeiltaste und direkt über die Adresse', async ({ app, page }) => {
    await app.kuerzelAnlegen({ kuerzel: 'E2E-REITER' })
    await app.kuerzelSeite('E2E-REITER')
    await page.getByRole('tab', { name: 'Testungen' }).click()
    await expect(page.getByRole('tab', { name: 'Testungen' })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: 'Stammdaten' })).toHaveAttribute('aria-selected', 'true')
    await expect(page).toHaveURL(/reiter=stammdaten/)
    await page.reload()
    await expect(page.getByRole('tab', { name: 'Stammdaten' })).toHaveAttribute('aria-selected', 'true')
  })

  test('aus der Testung zurück zum Kürzel', async ({ app, page }) => {
    await app.neueTestung({ kuerzel: 'E2E-ZURUECK' })
    await page.getByRole('link', { name: '← E2E-ZURUECK' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'E2E-ZURUECK' })).toBeVisible()
  })

  test('ungespeicherte Stammdaten: Rückfrage beim Verlassen, „Abbrechen“ bleibt auf der Seite', async ({ app, page }) => {
    await app.kuerzelAnlegen({ kuerzel: 'E2E-FRAGE' })
    await app.kuerzelSeite('E2E-FRAGE')
    await page.getByRole('tab', { name: 'Stammdaten' }).click()
    await page.getByPlaceholder('z. B. Fußball').fill('Handball')
    let gefragt = false
    page.once('dialog', (d) => {
      gefragt = true
      void d.dismiss()
    })
    await page.getByRole('navigation').first().getByRole('link', { name: 'Berichte', exact: true }).click()
    expect(gefragt).toBe(true)
    await expect(page).toHaveURL(/reiter=stammdaten/)
    await expect(page.getByPlaceholder('z. B. Fußball')).toHaveValue('Handball')
  })
})
