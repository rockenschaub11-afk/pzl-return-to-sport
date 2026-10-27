import { describe, expect, it } from 'vitest'
import { KATALOG, testNach } from '../katalog'
import type { TestDef } from '../katalog/typen'
import { bewerteTest } from '../rechnen/bewertung'
import { berechne, ERFASSUNG, hatEingabe, hqQuotient, parseZahl } from './erfassung'

const test = (id: string) => testNach(id) as TestDef
const kg = 80

describe('Eingaben lesen', () => {
  it('versteht Komma und Punkt', () => {
    expect(parseZahl('7,5')).toBe(7.5)
    expect(parseZahl(' 12.25 ')).toBe(12.25)
    expect(parseZahl('')).toBeNull()
    expect(parseZahl('abc')).toBeNull()
  })

  it('hat für jeden Test der Endtestung eine Erfassung', () => {
    for (const t of KATALOG.tests.filter((t) => t.inEndtestung)) expect(ERFASSUNG[t.id], t.id).toBeDefined()
  })

  it('zählt Einheit und Protokollwerte nicht als Eingabe', () => {
    expect(hatEingabe({ einheit: 'kg', winkel: '60' })).toBe(false)
    expect(hatEingabe({ b1: '20' })).toBe(true)
  })
})

describe('HHD Knie-Extension', () => {
  const t = test('hhd_knie_ext')

  it('Bestwert je Seite, kg → N, N/kg und LSI', () => {
    // gesund best 70 kg, betroffen best 63 kg → LSI 90 %, 63 × 9,81 / 80 = 7,73 N/kg
    const r = berechne(t, { g1: '68', g2: '70', g3: '69', b1: '61', b2: '63', b3: '62' }, { koerpergewichtKg: kg })
    expect(r.seiten).toEqual({ gesund: 70, betroffen: 63, einheit: 'kg' })
    expect(r.werte.lsi).toBeCloseTo(90, 6)
    expect(r.werte.relativ).toBeCloseTo(7.725, 3)
    expect(bewerteTest(t, 'rtc', r.werte).ampel).toBe('gruen')
  })

  it('Eingabe in N', () => {
    const r = berechne(t, { einheit: 'N', b1: '600' }, { koerpergewichtKg: kg })
    expect(r.werte.relativ).toBe(7.5)
  })

  it('ohne Körpergewicht kein Relativwert', () => {
    const r = berechne(t, { b1: '63' }, { koerpergewichtKg: null })
    expect(r.werte.relativ).toBeNull()
    expect(r.brauchtKoerpergewicht).toBe(true)
  })

  it('warnt bei Streuung über 10 %', () => {
    const r = berechne(t, { g1: '50', g2: '70', g3: '60', b1: '60', b2: '61', b3: '62' }, { koerpergewichtKg: kg })
    expect(r.streuung.map((s) => s.seite)).toEqual(['gesund'])
  })

  it('Nm/kg mit Hebelarm', () => {
    const r = berechne(t, { einheit: 'N', g1: '800', b1: '600', hebel: '0,4' }, { koerpergewichtKg: kg })
    expect(r.nmProKg).toEqual({ gesund: 4, betroffen: 3 })
  })

  it('LSI zur Vorverletzung (gleiche Einheit wie die Eingabe)', () => {
    const r = berechne(t, { b1: '63', vor: '70' }, { koerpergewichtKg: kg })
    expect(r.lsiVorverletzung).toBeCloseTo(90, 6)
  })
})

describe('CMJ', () => {
  it('nimmt den Versuch mit der größten Höhe – mit dessen Impulsen', () => {
    const r = berechne(
      test('cmj'),
      {
        v1_hoehe: '33,0', v1_impL: '14', v1_impR: '13',
        v2_hoehe: '35,2', v2_impL: '13,3', v2_impR: '12,5',
        v3_hoehe: '34,1', v3_impL: '15', v3_impR: '10',
      },
      { koerpergewichtKg: 60 },
    )
    expect(r.werte.hoehe).toBe(35.2)
    expect(r.werte.impuls_asymmetrie).toBeCloseTo(((13.3 - 12.5) / 13.3) * 100, 6)
    expect(r.werte.net_impulse).toBeCloseTo((25.8 * 9.81) / 60, 6)
  })
})

describe('SL-CMJ und SL-Drop-Jump', () => {
  it('SL-CMJ: Höhe betroffen, LSI, Impuls-Asymmetrie, Ns/kg', () => {
    const r = berechne(test('sl_cmj'), { g1_hoehe: '20', g1_imp: '10', b1_hoehe: '18', b1_imp: '9' }, { koerpergewichtKg: 70 })
    expect(r.werte).toMatchObject({ hoehe: 18, lsi: 90, impuls_asymmetrie: 10 })
    expect(r.werte.net_impulse).toBeCloseTo((9 * 9.81) / 70, 6)
  })

  it('SL-DJ: RSI des besten Sprungs der betroffenen Seite', () => {
    const r = berechne(test('sl_dj'), { g1_hoehe: '19', b1_hoehe: '17,5', b1_rsi: '0,52', b2_hoehe: '16', b2_rsi: '0,7' }, { koerpergewichtKg: 70 })
    expect(r.werte).toMatchObject({ hoehe: 17.5, rsi: 0.52 })
  })
})

describe('Hops, Kraftausdauer, Klinik, PROM', () => {
  it('6 m Hop: schnellste Zeit, LSI = gesund / betroffen', () => {
    const r = berechne(test('timed_hop'), { g1: '2,3', g2: '2,25', b1: '2,6', b2: '2,5' }, { koerpergewichtKg: kg })
    expect(r.seiten).toMatchObject({ gesund: 2.25, betroffen: 2.5 })
    expect(r.werte.lsi).toBeCloseTo(90, 6)
  })

  it('Kraftausdauer: ein Wert je Seite', () => {
    const r = berechne(test('sl_calf_raise'), { g: '30', b: '27' }, { koerpergewichtKg: kg })
    expect(r.werte).toMatchObject({ wdh: 27, lsi: 90 })
  })

  it('Flexion: betroffen in Grad und zur Gegenseite', () => {
    const r = berechne(test('rom_flexion'), { g: '140', b: '133' }, { koerpergewichtKg: kg })
    expect(r.werte).toMatchObject({ grad: 133, lsi: 95 })
  })

  it('SLR ja/nein und Erguss-Auswahl', () => {
    expect(berechne(test('slr'), { wert: 'ja' }, { koerpergewichtKg: kg }).werte.ohne_lag).toBe(true)
    expect(berechne(test('erguss'), { wert: 'Spur' }, { koerpergewichtKg: kg }).werte.grad).toBe('Spur')
  })

  it('ACL-RSI-Score', () => {
    expect(berechne(test('acl_rsi'), { wert: '62' }, { koerpergewichtKg: kg }).werte.score).toBe(62)
  })
})

describe('H/Q-Quotient (Etappe 12, Read S. 26)', () => {
  const flex = test('hhd_knie_flex')
  const ext = test('hhd_knie_ext')

  it('Flexion 90° / Extension 60° je Seite, auch bei gemischten Einheiten', () => {
    const f = berechne(flex, { g1: '30', b1: '27' }, { koerpergewichtKg: kg })
    const x = berechne(ext, { einheit: 'N', g1: String(50 * 9.81), b1: String(36 * 9.81) }, { koerpergewichtKg: kg })
    const q = hqQuotient(f, x)!
    expect(q.gesund).toBeCloseTo(0.6, 6)
    expect(q.betroffen).toBeCloseTo(0.75, 6) // schwacher Quadrizeps → Quotient zu hoch
    expect(q.ausDrehmoment).toBe(false)
  })

  it('aus Nm/kg, wenn bei beiden Tests ein Hebelarm angegeben ist', () => {
    const f = berechne(flex, { g1: '30', b1: '27', hebel: '0,3' }, { koerpergewichtKg: kg })
    const x = berechne(ext, { g1: '50', b1: '45', hebel: '0,4' }, { koerpergewichtKg: kg })
    const q = hqQuotient(f, x)!
    expect(q.ausDrehmoment).toBe(true)
    expect(q.gesund).toBeCloseTo((30 * 0.3) / (50 * 0.4), 6)
  })

  it('ohne Extension kein Quotient', () => {
    const f = berechne(flex, { g1: '30', b1: '27' }, { koerpergewichtKg: kg })
    expect(hqQuotient(f, berechne(ext, {}, { koerpergewichtKg: kg }))).toBeNull()
    expect(hqQuotient(f, undefined)).toBeNull()
  })
})
