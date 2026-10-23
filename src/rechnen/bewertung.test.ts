import { describe, expect, it } from 'vitest'
import { testNach } from '../katalog'
import type { TestDef } from '../katalog/typen'
import { bewerteKriterium, bewerteTest, schwelleFuer } from './bewertung'

const test = (id: string) => testNach(id) as TestDef
const kriterium = (testId: string, kritId: string) => test(testId).kriterien.find((k) => k.id === kritId)!

describe('Schwelle je Phase', () => {
  const knieExt = kriterium('hhd_knie_ext', 'relativ')

  it('nimmt den Wert der Phase', () => {
    expect(schwelleFuer(knieExt, 'mitte')).toEqual({ wert: 7, uebernommen: false, vonPhase: 'mitte' })
  })

  it('übernimmt bei leerer Phase den Wert davor (Read: 7,5 N/kg gilt bis > 9 Mo)', () => {
    expect(schwelleFuer(knieExt, 'rtc')).toEqual({ wert: 7.5, uebernommen: true, vonPhase: 'spaet' })
  })

  it('gilt vor dem ersten Wert nicht (CMJ-Höhe erst ab Mitte)', () => {
    expect(schwelleFuer(kriterium('cmj', 'hoehe'), 'frueh')).toBeNull()
  })

  it('CMJ-Asymmetrie: Mitte < 13,4 %, > 9 Mo < 10 %', () => {
    const k = kriterium('cmj', 'impuls_asymmetrie')
    expect(schwelleFuer(k, 'spaet')?.wert).toBe(13.4)
    expect(schwelleFuer(k, 'rtc')?.wert).toBe(10)
  })
})

describe('Ampel je Kriterium', () => {
  const lsiKrit = kriterium('hhd_knie_ext', 'lsi')

  it('LSI: grün ≥ 90, gelb 80–89, rot < 80', () => {
    expect(bewerteKriterium(lsiKrit, 'rtc', 92).ampel).toBe('gruen')
    expect(bewerteKriterium(lsiKrit, 'rtc', 85).ampel).toBe('gelb')
    expect(bewerteKriterium(lsiKrit, 'rtc', 79.9).ampel).toBe('rot')
  })

  it('LSI: Ampel nach der angezeigten Zahl (89,96 → 90,0 → grün)', () => {
    expect(bewerteKriterium(lsiKrit, 'rtc', 89.96)).toMatchObject({ ampel: 'gruen', wert: 90 })
    expect(bewerteKriterium(lsiKrit, 'rtc', 89.94)).toMatchObject({ ampel: 'gelb', wert: 89.9 })
  })

  it('Flexion zur Gegenseite: nur erfüllt / nicht erfüllt (≥ 95 %)', () => {
    const k = kriterium('rom_flexion', 'lsi')
    expect(bewerteKriterium(k, 'rtc', 95).ampel).toBe('gruen')
    expect(bewerteKriterium(k, 'rtc', 90).ampel).toBe('rot')
  })

  it('Absolutwert: erfüllt oder nicht', () => {
    const k = kriterium('hhd_knie_ext', 'relativ')
    expect(bewerteKriterium(k, 'rtc', 7.6).ampel).toBe('gruen')
    expect(bewerteKriterium(k, 'rtc', 7.5).ampel).toBe('rot') // „> 7,5“
    expect(bewerteKriterium(k, 'rtc', 7.54).ampel).toBe('rot') // angezeigt 7,5
  })

  it('Asymmetrie: weniger ist besser', () => {
    const k = kriterium('cmj', 'impuls_asymmetrie')
    expect(bewerteKriterium(k, 'rtc', 8).ampel).toBe('gruen')
    expect(bewerteKriterium(k, 'rtc', 12).ampel).toBe('rot')
  })

  it('Auswahl und Ja/Nein (Erguss, SLR)', () => {
    const erguss = kriterium('erguss', 'grad')
    expect(bewerteKriterium(erguss, 'rtc', 'Spur').ampel).toBe('gruen')
    expect(bewerteKriterium(erguss, 'rtc', '1+').ampel).toBe('rot')
    expect(bewerteKriterium(kriterium('slr', 'ohne_lag'), 'rtc', false).ampel).toBe('rot')
  })

  it('Info-Kriterien haben keine Ampel (RSI beim Drop Jump, IKDC)', () => {
    expect(bewerteKriterium(kriterium('sl_dj', 'rsi'), 'rtc', 0.4)).toMatchObject({ zustand: 'info', zaehlt: false })
    expect(bewerteKriterium(kriterium('ikdc', 'score'), 'rtc', 82)).toMatchObject({ zustand: 'info', zaehlt: false })
  })

  it('ACL-RSI unter 55: Warnung, zählt aber nicht für die Ampel', () => {
    const e = bewerteKriterium(kriterium('acl_rsi', 'score'), 'rtc', 48)
    expect(e).toMatchObject({ ampel: 'gelb', zaehlt: false })
    expect(e.hinweis).toContain('Warnung')
  })

  it('Kriterium außerhalb seiner Phasen: nicht anwendbar', () => {
    expect(bewerteKriterium(kriterium('cmj', 'hoehe'), 'frueh', 30).zustand).toBe('nicht_anwendbar')
  })
})

describe('Gesamt-Ampel eines Tests', () => {
  const knieExt = test('hhd_knie_ext')

  it('grün, wenn Absolutwert und LSI erfüllt', () => {
    expect(bewerteTest(knieExt, 'rtc', { relativ: 7.8, lsi: 93 })).toMatchObject({ ampel: 'gruen', vollstaendig: true })
  })

  it('die schlechtere Bewertung zählt', () => {
    expect(bewerteTest(knieExt, 'rtc', { relativ: 7.8, lsi: 85 }).ampel).toBe('gelb')
    expect(bewerteTest(knieExt, 'rtc', { relativ: 7.0, lsi: 95 }).ampel).toBe('rot')
  })

  it('unvollständig, solange ein Wert fehlt', () => {
    expect(bewerteTest(knieExt, 'rtc', { lsi: 95 })).toMatchObject({ ampel: 'gruen', vollstaendig: false })
    expect(bewerteTest(knieExt, 'rtc', {}).ampel).toBeNull()
  })

  it('Frauen: Absolutwert nicht erreicht → kein Rot, Ampel vom LSI, mit Hinweis', () => {
    const e = bewerteTest(knieExt, 'rtc', { relativ: 7.0, lsi: 95 }, { geschlecht: 'weiblich' })
    expect(e.ampel).toBe('gruen')
    expect(e.hinweise[0]).toContain('nicht geschlechtsspezifisch')
  })

  it('Männer: gleicher Wert bleibt rot', () => {
    expect(bewerteTest(knieExt, 'rtc', { relativ: 7.0, lsi: 95 }, { geschlecht: 'maennlich' }).ampel).toBe('rot')
  })
})
