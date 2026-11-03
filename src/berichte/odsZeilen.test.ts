import { beforeEach, describe, expect, it } from 'vitest'
import { beispielAnlegen } from '../beispiel'
import { db, type Testung } from '../db'
import type { Patient } from '../patienten/stammdaten'
import { auswahlBereinigen } from '../testung/meloqAuswahl'
import { arztBericht, patBericht } from './bericht'
import { lsiUebersicht } from './lsiZeilen'
import { odsFuerTestung } from './odsZeilen'

let patient: Patient
let testungen: Testung[]
let ende: Testung

beforeEach(async () => {
  await db.patienten.clear()
  await db.testungen.clear()
  const id = await beispielAnlegen()
  patient = (await db.patienten.get(id))!
  testungen = (await db.testungen.where('patientId').equals(id).toArray()).sort((a, b) => a.datum.localeCompare(b.datum))
  ende = testungen[2]
})

describe('ODS-Seitenvergleich', () => {
  it('SL-CMJ: Sprunghöhe mit Ampel, Net Impulse und Contraction Time ohne – je Seite aus dem gewerteten Versuch', () => {
    const cmj = odsFuerTestung(patient, ende).find((v) => v.test === 'sl_cmj')!
    expect(cmj.zeilen.map((z) => [z.ods, z.id])).toEqual([
      ['output', 'hoehe'],
      ['driver', 'net_impulse'],
      ['strategy', 'ct'],
    ])
    const [hoehe, impuls, ct] = cmj.zeilen
    expect(hoehe).toMatchObject({ gesund: 20.5, betroffen: 18.6, ampel: 'gruen', ziel: 90 })
    expect(hoehe.lsi).toBeCloseTo((18.6 / 20.5) * 100)
    // 9,8 bzw. 9 kg·s bei 78 kg → Ns/kg; der LSI hängt nicht von der Umrechnung ab
    expect(impuls).toMatchObject({ einheit: 'Ns/kg', ampel: null, ziel: null })
    expect(impuls.gesund).toBeCloseTo((9.8 * 9.81) / 78)
    expect(impuls.lsi).toBeCloseTo((9 / 9.8) * 100)
    expect(ct).toMatchObject({ gesund: 650, betroffen: 690, zeit: true, ampel: null })
  })

  it('SL-Drop-Jump: Sprunghöhe knapp, RSI und Kontaktzeit ohne Bewertung', () => {
    const dj = odsFuerTestung(patient, ende).find((v) => v.test === 'sl_dj')!
    expect(dj.zeilen.map((z) => z.id)).toEqual(['hoehe', 'rsi', 'kz'])
    expect(dj.zeilen[0].ampel).toBe('gelb')
    expect(dj.zeilen[1].lsi).toBeCloseTo((0.48 / 0.55) * 100)
    expect(dj.zeilen[2]).toMatchObject({ zeit: true, ampel: null })
  })

  it('ohne zweite ODS-Gruppe kein Vergleich', () => {
    const nurHoehe = { ...ende, eingaben: { sl_cmj: { g1_hoehe: '20', b1_hoehe: '18' } } }
    expect(odsFuerTestung(patient, nurHoehe)).toEqual([])
  })
})

describe('Seitenvergleich-Matrix', () => {
  it('Bestwerte je Seite wie in der Ergebnistabelle und LSI-Spanne aus allen Versuchen', () => {
    const z = lsiUebersicht(arztBericht(patient, ende, auswahlBereinigen(undefined)), patBericht(patient, ende, testungen))
    const ext = z.find((x) => x.id === 'hhd_knie_ext')!
    expect(ext.gesund).toBe('8,3 N/kg')
    expect(ext.betroffen).toBe('7,8 N/kg')
    // Versuche gesund 64–66 kg, betroffen 60–62 kg
    expect(ext.spanne![0]).toBeCloseTo((60 / 66) * 100)
    expect(ext.spanne![1]).toBeCloseTo((62 / 64) * 100)
    // nur ein Wert je Seite: keine Spanne
    expect(z.find((x) => x.id === 'sl_bridge')?.spanne).toBeNull()
  })
})
