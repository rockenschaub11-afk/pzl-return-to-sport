import { describe, expect, it } from 'vitest'
import { testNach } from '../katalog'
import type { TestDef } from '../katalog/typen'
import { hinzufuegbar, phaseAusMonaten, phasenStand, sichtbareTests, testset, werteAus, wochenBisTestung } from './ablauf'
import { berechne } from './erfassung'

const ids = (tests: TestDef[]) => tests.map((t) => t.id)
const OP = '2026-01-15'

describe('Phase aus dem OP-Datum (volle Monate bis zur Testung)', () => {
  it('Grenzen: < 3 Früh, 3–< 5 Mitte, 5–< 8 Spät, 8–< 9 8–9 Mo, ab 9 > 9 Mo', () => {
    expect([0, 2, 3, 4, 5, 7, 8, 9, 14].map(phaseAusMonaten)).toEqual(['frueh', 'frueh', 'mitte', 'mitte', 'spaet', 'spaet', 'rtt', 'rtc', 'rtc'])
  })

  it('rechnet bis zum Datum der Testung', () => {
    const t = { phase: 'frueh' as const, datum: '2026-05-20', status: 'in_arbeit' as const }
    expect(phasenStand(t, OP)).toMatchObject({ phase: 'mitte', art: 'verlauf', uebersteuert: false, fix: false })
    expect(phasenStand({ ...t, datum: '2026-10-01' }, OP)).toMatchObject({ phase: 'rtt', art: 'endtestung' }) // 8 volle Monate
  })

  it('übersteuern zählt nur mit Begründung', () => {
    const t = { phase: 'mitte' as const, datum: '2026-05-20', status: 'in_arbeit' as const }
    expect(phasenStand({ ...t, phaseUebersteuert: { phase: 'spaet', begruendung: '' } }, OP).phase).toBe('mitte')
    expect(phasenStand({ ...t, phaseUebersteuert: { phase: 'spaet', begruendung: 'Re-OP, Zeitplan verschoben' } }, OP)).toMatchObject({
      phase: 'spaet',
      automatisch: 'mitte',
      uebersteuert: true,
    })
  })

  it('abgeschlossen: gespeicherte Phase bleibt, auch wenn sich das Datum ändern würde', () => {
    expect(phasenStand({ phase: 'mitte', datum: '2026-12-01', status: 'abgeschlossen' }, OP)).toMatchObject({ phase: 'mitte', fix: true })
  })

  it('ältere Testungen ohne gespeicherte Phase bleiben „> 9 Mo“', () => {
    expect(phasenStand({ datum: '2026-03-01', status: 'in_arbeit' }, OP)).toMatchObject({ phase: 'rtc', art: 'endtestung', fix: true })
  })

  it('Wochen seit OP für den HHD-Hinweis', () => {
    expect(wochenBisTestung(OP, '2026-03-01')).toBe(6)
  })
})

describe('Testset je Phase (ENTSCHEIDUNGEN 7.2)', () => {
  it('Früh: Klinik, HHD, beidbeinige Kraftausdauer, SL-Squat, Einbeinstand, Kniebeuge-Asymmetrie', () => {
    expect(ids(testset('frueh'))).toEqual(
      expect.arrayContaining(['erguss', 'hhd_knie_ext', 'bridge_beidbeinig', 'calf_raise_beidbeinig', 'sl_squat', 'sl_balance', 'kniebeuge_asym']),
    )
    expect(ids(testset('frueh'))).not.toContain('cmj')
  })

  it('Mitte: CMJ, SL-CMJ, Hops, einbeinige Kraftausdauer – kein SL-Drop-Jump', () => {
    const mitte = ids(testset('mitte'))
    expect(mitte).toEqual(expect.arrayContaining(['cmj', 'sl_cmj', 'single_hop', 'sl_bridge', 'hop_platte', 'sl_squat']))
    expect(mitte).not.toContain('sl_dj')
  })

  it('Spät: zusätzlich Drop Jump beidbeinig und IMTP', () => {
    expect(ids(testset('spaet'))).toEqual(expect.arrayContaining(['dj_bilateral', 'imtp']))
  })

  it('optionale Tests erst nach Hinzufügen; weitere Tests aus dem ganzen Katalog', () => {
    const t = { optionaleTests: [] as string[] }
    expect(ids(sichtbareTests(t, 'mitte'))).not.toContain('plantarflexion')
    const h = hinzufuegbar(t, 'mitte')
    expect(ids(h.optional)).toContain('plantarflexion')
    expect(ids(h.weitere)).toContain('sl_dj')
    expect(ids(sichtbareTests({ optionaleTests: ['sl_dj'] }, 'mitte'))).toContain('sl_dj')
  })
})

describe('Verlaufstests: Eingabe und Schwellen der Phase', () => {
  it('SL-Squat: Winkel der betroffenen Seite, Mitte > 90°', () => {
    const t = testNach('sl_squat') as TestDef
    const b = berechne(t, { g: '100', b: '85' }, { koerpergewichtKg: 70 })
    expect(b.werte).toMatchObject({ winkel: 85 })
    const a = werteAus({ eingaben: { sl_squat: { g: '100', b: '85' } }, koerpergewichtKg: '70' }, 'mitte').get('sl_squat')!
    expect(a.ergebnis.kriterien.find((k) => k.kriterium.id === 'winkel')?.ampel).toBe('rot')
    const frueh = werteAus({ eingaben: { sl_squat: { g: '100', b: '85' } }, koerpergewichtKg: '70' }, 'frueh').get('sl_squat')!
    expect(frueh.ergebnis.kriterien.find((k) => k.kriterium.id === 'winkel')?.ampel).toBe('gruen') // > 70°
  })

  it('Drop Jump beidbeinig: Werte direkt wie bei Meloq', () => {
    const t = testNach('dj_bilateral') as TestDef
    expect(berechne(t, { hoehe: '29,5', asymmetrie: '7' }, { koerpergewichtKg: 70 }).werte).toMatchObject({ hoehe: 29.5, asymmetrie: 7 })
  })

  it('Knie-Extension in der Mitte-Phase: Schwelle 7,0 N/kg statt 7,5', () => {
    const e = { hhd_knie_ext: { g1: '60', b1: '52' } } // 52 × 9,81 / 70 = 7,3 N/kg
    const mitte = werteAus({ eingaben: e, koerpergewichtKg: '70' }, 'mitte').get('hhd_knie_ext')!
    const rtc = werteAus({ eingaben: e, koerpergewichtKg: '70' }, 'rtc').get('hhd_knie_ext')!
    expect(mitte.ergebnis.kriterien[0].ampel).toBe('gruen')
    expect(rtc.ergebnis.kriterien[0].ampel).toBe('rot')
  })
})
