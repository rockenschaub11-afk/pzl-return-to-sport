import { describe, expect, it } from 'vitest'
import { testNach } from '../katalog'
import { berechne } from '../testung/erfassung'
import { boxTatsaechlich, impulsRichtung, nachSeite, protokollTeile, richtung, rohdaten, streuungHinweis } from './nachvollziehbarkeit'

const test = (id: string) => testNach(id)!
const rechne = (id: string, e: Record<string, string>) => berechne(test(id), e, { koerpergewichtKg: 78 })

describe('Protokoll je Test', () => {
  it('Standard, tatsächlicher Wert und Abweichung', () => {
    expect(protokollTeile(test('hhd_knie_ext'), { g1: '60' })).toEqual([
      { text: 'Winkel 60° (Standard)', abweichend: false },
      { text: 'Eingabe in kg', abweichend: false },
    ])
    expect(protokollTeile(test('hhd_knie_ext'), { winkel: '70', einheit: 'N', hebel: '0,32' })).toEqual([
      { text: 'Winkel 70° – Standard 60°', abweichend: true },
      { text: 'Eingabe in N', abweichend: false },
      { text: 'Hebelarm 0,32 m', abweichend: false },
    ])
    // SL-Drop-Jump: Standard 15 cm ab 29.10.2026, davor 30 cm (alte Testungen ohne eingetragene Box bleiben richtig)
    expect(protokollTeile(test('sl_dj'), {}, '2026-10-29')).toEqual([{ text: 'Box 15 cm (Standard)', abweichend: false }])
    expect(protokollTeile(test('sl_dj'), {}, '2026-10-28')).toEqual([{ text: 'Box 30 cm (Standard)', abweichend: false }])
    expect(protokollTeile(test('sl_dj'), { box: '30' }, '2026-05-02')).toEqual([{ text: 'Box 30 cm', abweichend: false }])
    expect(protokollTeile(test('sl_dj'), { box: '30' }, '2026-11-02')).toEqual([{ text: 'Box 30 cm – Standard 15 cm', abweichend: true }])
    expect(boxTatsaechlich(test('sl_dj'), {}, '2026-05-02')).toBe(30)
    expect(boxTatsaechlich(test('sl_dj'), {}, '2026-11-02')).toBe(15)
    expect(boxTatsaechlich(test('cmj'), {}, '2026-11-02')).toBeNull()
    expect(protokollTeile(test('single_hop'), { g1: '150' })).toEqual([])
  })
})

describe('Richtung der Asymmetrie', () => {
  it('ordnet L/R der betroffenen Seite zu', () => {
    expect(nachSeite(1, 2, 'links')).toEqual({ betroffen: 1, gesund: 2 })
    expect(nachSeite(1, 2, 'rechts')).toEqual({ betroffen: 2, gesund: 1 })
    expect(nachSeite(1, 2, '')).toBeNull()
    expect(richtung(9, 10)).toBe('schwaecher')
    expect(richtung(10, 10)).toBe('gleich')
    expect(richtung(null, 10)).toBeNull()
  })

  it('CMJ nach dem gewerteten Versuch, SL-CMJ nach gesund/betroffen', () => {
    // gewertet: Versuch 2 (größte Höhe), R = 12 kleiner als L = 14
    const e = { v1_hoehe: '30', v1_impL: '10', v1_impR: '15', v2_hoehe: '31', v2_impL: '14', v2_impR: '12' }
    expect(impulsRichtung(test('cmj'), e, rechne('cmj', e), 'rechts')).toBe('schwaecher')
    expect(impulsRichtung(test('cmj'), e, rechne('cmj', e), 'links')).toBe('staerker')
    const s = { g1_hoehe: '20', g1_imp: '9,8', b1_hoehe: '18', b1_imp: '9' }
    expect(impulsRichtung(test('sl_cmj'), s, rechne('sl_cmj', s), 'links')).toBe('schwaecher')
    expect(impulsRichtung(test('single_hop'), {}, rechne('single_hop', {}), 'links')).toBeNull()
  })
})

describe('Rohdaten', () => {
  it('Kraft: Versuche je Seite, Bestwert markiert, CV je Seite', () => {
    const e = { g1: '64', g2: '66', g3: '65', b1: '60', b2: '62', b3: '50' }
    const r = rohdaten(test('hhd_knie_ext'), e, rechne('hhd_knie_ext', e))!
    expect(r.einheit).toBe('kg')
    expect(r.zeilen.map((z) => z.seite)).toEqual(['gesund', 'betroffen'])
    expect(r.zeilen[0]).toMatchObject({ werte: [64, 66, 65], gewertet: 1, cvHoch: false })
    expect(r.zeilen[1].cv).toBeGreaterThan(10)
    expect(r.zeilen[1].cvHoch).toBe(true)
  })

  it('6 m Hop: schnellster Versuch gewertet', () => {
    const e = { g1: '2,12', g2: '2,1', b1: '2,3', b2: '2,28' }
    const r = rohdaten(test('timed_hop'), e, rechne('timed_hop', e))!
    expect(r.gewertet).toBe('schnellster Versuch')
    expect(r.zeilen[0].gewertet).toBe(1)
    expect(r.zeilen[1].werte).toEqual([2.3, 2.28, null])
  })

  it('Sprünge: Versuch mit der größten Höhe; Tests ohne Versuche ohne Rohdaten', () => {
    const e = { v1_hoehe: '33,5', v2_hoehe: '34,6', v3_hoehe: '34' }
    const r = rohdaten(test('cmj'), e, rechne('cmj', e))!
    expect(r.zeilen).toEqual([expect.objectContaining({ seite: 'beidbeinig', gewertet: 1 })])
    expect(rohdaten(test('sl_bridge'), { g: '28', b: '27' }, rechne('sl_bridge', { g: '28', b: '27' }))).toBeNull()
    expect(rohdaten(test('hhd_knie_ext'), {}, rechne('hhd_knie_ext', {}))).toBeNull()
  })

  it('Streuungshinweis statt „Messung ggf. wiederholt“', () => {
    expect(streuungHinweis('betroffen', 12.04)).toBe('Streuung betroffen: CV 12 % (> 10 %, Read S. 32) – mit Vorsicht interpretieren')
  })
})
