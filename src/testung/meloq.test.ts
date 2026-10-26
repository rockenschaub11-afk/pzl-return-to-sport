import { describe, expect, it } from 'vitest'
import { testNach } from '../katalog'
import { MELOQ, pruefeMeloq } from '../katalog/meloq'
import type { TestDef } from '../katalog/typen'
import { berechne } from './erfassung'
import { kernStrategie, relativWert, zusatzZeilen } from './meloq'
import { auswahlBereinigen } from './meloqAuswahl'

describe('Meloq-Metriken (config/meloq.json)', () => {
  it('sind fehlerfrei', () => {
    expect(pruefeMeloq(MELOQ)).toEqual([])
  })

  it('Standard: Flugzeit, Peak Force, Peak Power', () => {
    expect(MELOQ.standard.cmj).toEqual(['flugzeit', 'peak_force', 'peak_power'])
  })

  it('erkennt einen Standard, den es für den Test nicht gibt', () => {
    const kaputt = structuredClone(MELOQ)
    kaputt.standard.sl_dj = ['peak_velocity']
    expect(pruefeMeloq(kaputt).join()).toContain('„peak_velocity“ gibt es für diesen Test nicht')
  })
})

describe('Umrechnung relativ', () => {
  it('kg → N/kg, W → W/kg, kg/s → N/s', () => {
    expect(relativWert(80, 'N/kg', 80)).toBeCloseTo(9.81, 6)
    expect(relativWert(4000, 'W/kg', 80)).toBe(50)
    expect(relativWert(100, 'N/s', null)).toBeCloseTo(981, 6)
    expect(relativWert(80, 'N/kg', null)).toBeNull()
  })
})

describe('Kern-Satz Strategy aus dem gewerteten Versuch', () => {
  it('CMJ: Contraction Time des höchsten Sprungs', () => {
    const t = testNach('cmj') as TestDef
    const e = { v1_hoehe: '30', v1_ct: '700', v2_hoehe: '34', v2_ct: '815' }
    const z = kernStrategie('cmj', e, berechne(t, e, { koerpergewichtKg: 70 }))
    expect(z.werte).toEqual([815])
  })

  it('SL-DJ: Kontaktzeit je Bein mit LSI', () => {
    const t = testNach('sl_dj') as TestDef
    const e = { g1_hoehe: '18', g1_kz: '250', b1_hoehe: '15', b1_kz: '300', b2_hoehe: '16', b2_kz: '275' }
    const z = kernStrategie('sl_dj', e, berechne(t, e, { koerpergewichtKg: 70 }))
    expect(z.werte).toEqual([250, 275])
    expect(z.vergleich?.wert).toBeCloseTo(110, 6)
  })
})

describe('Zusatzmetriken', () => {
  it('CMJ: links/rechts mit Asymmetrie und N/kg', () => {
    const [pf] = zusatzZeilen('cmj', { z_peak_force_l: '100', z_peak_force_r: '90' }, ['peak_force'], 80)
    expect(pf.form).toBe('lr')
    expect(pf.vergleich).toEqual({ art: 'asymmetrie', wert: 10 })
    expect(pf.relativ?.werte[0]).toBeCloseTo(12.2625, 4)
  })

  it('CMJ: Flugzeit ist ein einzelner Wert', () => {
    const [f] = zusatzZeilen('cmj', { z_flugzeit: '520' }, ['flugzeit'], 80)
    expect(f).toMatchObject({ form: 'eins', werte: [520] })
  })

  it('einbeinig: gesund/betroffen mit LSI', () => {
    const [pp] = zusatzZeilen('sl_cmj', { z_peak_power_g: '2000', z_peak_power_b: '1800' }, ['peak_power'], 80)
    expect(pp.vergleich).toEqual({ art: 'lsi', wert: 90 })
  })

  it('zeigt nur gewählte Metriken in der Reihenfolge der Konfiguration', () => {
    expect(zusatzZeilen('cmj', {}, ['peak_power', 'flugzeit'], 80).map((z) => z.id)).toEqual(['flugzeit', 'peak_power'])
  })
})

describe('Persönlicher Standard', () => {
  it('nimmt den Standard, solange nichts gespeichert ist', () => {
    expect(auswahlBereinigen(undefined)).toEqual(MELOQ.standard)
  })

  it('behält eine gespeicherte (auch leere) Auswahl und verwirft Unbekanntes', () => {
    const a = auswahlBereinigen({ cmj: ['peak_velocity', 'gibt_es_nicht'], sl_dj: [] })
    expect(a.cmj).toEqual(['peak_velocity'])
    expect(a.sl_dj).toEqual([])
    expect(a.sl_cmj).toEqual(MELOQ.standard.sl_cmj)
  })
})
