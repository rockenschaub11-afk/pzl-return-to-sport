import { expect, type Locator, type Page } from '@playwright/test'

export type Seite = 'gesund' | 'betroffen'

/** Seite „Testung erfassen“ – so, wie die Therapeut:in sie bedient. */
export class TestungSeite {
  constructor(
    readonly page: Page,
    /** betroffene Seite des Kürzels – davon hängen die Zeilennamen ab („Gesund (rechts)“) */
    readonly betroffen: 'links' | 'rechts',
  ) {}

  get id(): string {
    return new URL(this.page.url()).hash.replace('#/testung/', '')
  }

  zeilenname(seite: Seite): string {
    const gegen = this.betroffen === 'links' ? 'rechts' : 'links'
    return seite === 'gesund' ? `Gesund (${gegen})` : `Betroffen (${this.betroffen})`
  }

  karte(testId: string): Locator {
    return this.page.locator(`#test-${testId}`)
  }

  /** Karte aufklappen, falls sie zu ist */
  async oeffne(testId: string): Promise<Locator> {
    const karte = this.karte(testId)
    await karte.scrollIntoViewIfNeeded()
    const knopf = karte.locator('.test-klapp')
    if ((await knopf.getAttribute('aria-expanded')) === 'false') await knopf.click()
    return karte
  }

  async koerpergewicht(kg: string): Promise<void> {
    await this.page.getByPlaceholder('z. B. 72,5').fill(kg)
  }

  /** Versuche einer Seite eintippen (Versuch 1, 2, 3 …) */
  async versuche(testId: string, seite: Seite, werte: string[]): Promise<void> {
    const karte = await this.oeffne(testId)
    for (const [i, wert] of werte.entries()) {
      await karte.getByLabel(`${this.zeilenname(seite)} Versuch ${i + 1}`, { exact: true }).fill(wert)
    }
  }

  async einheit(testId: string, einheit: 'kg' | 'N'): Promise<void> {
    const karte = await this.oeffne(testId)
    await karte.locator('.einheit-wahl').getByRole('button', { name: einheit, exact: true }).click()
  }

  /** Ergebniszeile eines Kriteriums, z. B. „LSI“ oder „Kraft relativ“ */
  kriterium(testId: string, bezeichnung: string): Locator {
    return this.karte(testId)
      .locator('.kriterium-zeile')
      .filter({ has: this.page.locator('.kriterium-name', { hasText: new RegExp(`^${bezeichnung}`) }) })
  }

  bestwert(testId: string, seite: Seite): Locator {
    return this.karte(testId).getByRole('row', { name: new RegExp(`^${this.zeilenname(seite).replace(/[()]/g, '\\$&')}`) }).locator('.bestwert')
  }

  speicherstand(): Locator {
    return this.page.locator('.speicher-status')
  }

  /** wartet, bis alles geschrieben ist – nie mit fester Pause */
  async gespeichert(): Promise<void> {
    await expect(this.speicherstand()).toHaveText('✓ gespeichert')
  }
}
