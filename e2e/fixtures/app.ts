// Gemeinsame Ausgangslage für alle Tests:
// - feste Uhrzeit (Phase und Zeitkriterium hängen vom heutigen Datum ab)
// - frischer Browser-Speicher je Test (Playwright legt je Test einen neuen Kontext an)
// - Testdaten nur mit Kürzeln „E2E-…“, angelegt über die Oberfläche

import { test as basis, expect, type Page } from '@playwright/test'
import { TestungSeite } from '../seiten/testung'

/** „Heute“ in allen Tests */
export const HEUTE = new Date('2026-06-15T09:00:00+02:00')

export interface KuerzelDaten {
  kuerzel: string
  seite?: 'links' | 'rechts'
  niveau?: 'Wettkampf' | 'Freizeit'
  /** JJJJ-MM-TT; Standard 12 Monate vor HEUTE → Endtestung „> 9 Mo“ */
  opDatum?: string
}

export class App {
  constructor(readonly page: Page) {}

  async oeffne(pfad = '/'): Promise<void> {
    await this.page.goto(`#${pfad}`)
  }

  /** Kürzel über das Formular anlegen; endet auf der Pat.-Liste */
  async kuerzelAnlegen({ kuerzel, seite = 'links', niveau = 'Wettkampf', opDatum = '2025-06-01' }: KuerzelDaten): Promise<void> {
    await this.oeffne('/patienten/neu')
    await this.page.getByPlaceholder('MH-1998').fill(kuerzel)
    await this.page.getByRole('group', { name: 'Betroffene Seite' }).getByRole('button', { name: seite === 'links' ? 'Links' : 'Rechts' }).click()
    await this.page.getByRole('group', { name: 'Niveau' }).getByRole('button', { name: niveau }).click()
    await this.page.getByLabel('OP-Datum').fill(opDatum)
    await this.page.getByRole('button', { name: 'Speichern' }).click()
    await expect(this.page).toHaveURL(/#\/patienten$/)
  }

  async kuerzelSeite(kuerzel: string): Promise<void> {
    await this.oeffne('/patienten')
    await this.page.getByRole('link', { name: kuerzel }).click()
    await expect(this.page.getByRole('heading', { level: 1, name: kuerzel })).toBeVisible()
  }

  /** Kürzel anlegen und eine Testung von heute starten */
  async neueTestung(daten: KuerzelDaten): Promise<TestungSeite> {
    await this.kuerzelAnlegen(daten)
    await this.kuerzelSeite(daten.kuerzel)
    await this.page.getByRole('button', { name: 'Neue Testung' }).click()
    await expect(this.page).toHaveURL(/#\/testung\/[\w-]+$/)
    await expect(this.page.getByRole('heading', { level: 1 })).toContainText(daten.kuerzel)
    return new TestungSeite(this.page, daten.seite ?? 'links')
  }
}

export const test = basis.extend<{ app: App }>({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(HEUTE)
    await use(page)
  },
  app: async ({ page }, use) => {
    await use(new App(page))
  },
})

export { expect }
