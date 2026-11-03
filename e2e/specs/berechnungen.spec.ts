// P1: Berechnungen mit bekannten Eingaben und eindeutig nachrechenbaren Sollwerten (Rechenweg in fixtures/sollwerte.ts).

import { expect, test } from '../fixtures/app'
import { KRAFT_LSI, KRAFT_NEWTON, KRAFT_RELATIV, STREUUNG, ZEITTEST } from '../fixtures/sollwerte'

const KNIE_EXT = 'hhd_knie_ext'

test.describe('LSI der Kraft (Knie-Extension, HHD)', () => {
  for (const [i, fall] of KRAFT_LSI.entries()) {
    test(fall.name, async ({ app }) => {
      const testung = await app.neueTestung({ kuerzel: `E2E-LSI${i}` })
      await testung.versuche(KNIE_EXT, 'gesund', fall.gesund)
      await testung.versuche(KNIE_EXT, 'betroffen', fall.betroffen)
      const lsi = testung.kriterium(KNIE_EXT, 'LSI')
      await expect(lsi.locator('.kriterium-wert')).toHaveText(fall.lsi)
      await expect(lsi.locator('.kriterium-ampel')).toHaveText(new RegExp(`${fall.ampel}$`))
    })
  }

  test('nimmt je Seite den besten von drei Versuchen', async ({ app }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-BEST' })
    await testung.versuche(KNIE_EXT, 'gesund', KRAFT_LSI[0].gesund)
    await testung.versuche(KNIE_EXT, 'betroffen', KRAFT_LSI[0].betroffen)
    await expect(testung.bestwert(KNIE_EXT, 'gesund')).toHaveText('100 kg')
    await expect(testung.bestwert(KNIE_EXT, 'betroffen')).toHaveText('80 kg')
  })

  test('rechnet in Newton dasselbe wie in kg', async ({ app }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-NEWTON' })
    await testung.einheit(KNIE_EXT, 'N')
    await testung.versuche(KNIE_EXT, 'gesund', KRAFT_NEWTON.gesund)
    await testung.versuche(KNIE_EXT, 'betroffen', KRAFT_NEWTON.betroffen)
    await expect(testung.kriterium(KNIE_EXT, 'LSI').locator('.kriterium-wert')).toHaveText(KRAFT_NEWTON.lsi)
  })

  test('Kraft relativ: betroffene Seite × 9,81 / Körpergewicht', async ({ app }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-REL' })
    await testung.koerpergewicht(KRAFT_RELATIV.koerpergewicht)
    await testung.versuche(KNIE_EXT, 'gesund', [KRAFT_RELATIV.gesund])
    await testung.versuche(KNIE_EXT, 'betroffen', [KRAFT_RELATIV.betroffen])
    const relativ = testung.kriterium(KNIE_EXT, 'Kraft relativ')
    await expect(relativ.locator('.kriterium-wert')).toHaveText(KRAFT_RELATIV.anzeige)
    await expect(relativ.locator('.kriterium-ziel')).toHaveText(`Ziel ${KRAFT_RELATIV.ziel}`)
    await expect(relativ.locator('.kriterium-ampel')).toHaveText(/erfüllt$/)
  })
})

test.describe('Zeittest und Streuung', () => {
  test('6 m Hop auf Zeit: LSI = gesund / betroffen, Bestwert = schnellster Versuch', async ({ app }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-ZEIT' })
    await testung.versuche('timed_hop', 'gesund', ZEITTEST.gesund)
    await testung.versuche('timed_hop', 'betroffen', ZEITTEST.betroffen)
    await expect(testung.bestwert('timed_hop', 'gesund')).toHaveText(ZEITTEST.bestGesund)
    await expect(testung.bestwert('timed_hop', 'betroffen')).toHaveText(ZEITTEST.bestBetroffen)
    await expect(testung.kriterium('timed_hop', 'LSI').locator('.kriterium-wert')).toHaveText(ZEITTEST.lsi)
  })

  test('streuen die Versuche über 10 %, fragt die App „Messung wiederholen?“', async ({ app }) => {
    const testung = await app.neueTestung({ kuerzel: 'E2E-CV' })
    await testung.versuche(KNIE_EXT, 'gesund', STREUUNG.gesund)
    await testung.versuche(KNIE_EXT, 'betroffen', STREUUNG.betroffen)
    const karte = testung.karte(KNIE_EXT)
    // nur die gesunde Seite streut (12,4 %), die betroffene nicht (0 %)
    await expect(karte).toContainText(`Messung wiederholen? Die Versuche (${testung.zeilenname('gesund')})`)
    await expect(karte).not.toContainText(`Messung wiederholen? Die Versuche (${testung.zeilenname('betroffen')})`)
  })
})
