import { describe, expect, it } from 'vitest'
import type { Testung } from '../db'
import { fehlendeMessungen, kriterienFuer, phasenBaender, verfuegbareOptionen, VERLAUF_OPTIONEN, verlaufsDaten, zielkorridor } from './verlauf'

const patient = { opDatum: '2026-01-15', geschlecht: 'maennlich' as const }

const testung = (id: string, datum: string, eingaben: Testung['eingaben'], phase: Testung['phase'] = 'mitte'): Testung => ({
  id,
  patientId: 'p',
  art: 'verlauf',
  phase,
  status: 'in_arbeit',
  datum,
  koerpergewichtKg: '70',
  tegnerAktuell: '',
  eingaben,
  optionaleTests: [],
  angelegtAm: '',
  geaendertAm: '',
})

const option = (id: string) => VERLAUF_OPTIONEN.find((o) => o.id === id)!

describe('Verlauf', () => {
  const testungen = [
    testung('b', '2026-07-20', { hhd_knie_ext: { g1: '60', b1: '54' }, cmj: { v1_hoehe: '31', v1_impL: '13', v1_impR: '12', v1_ct: '820' } }),
    testung('a', '2026-04-20', { hhd_knie_ext: { g1: '55', b1: '40' } }),
  ]

  it('Knie-Extension: N/kg je Seite und LSI, nach Datum sortiert', () => {
    const p = verlaufsDaten(patient, testungen, option('hhd_knie_ext'))
    expect(p.map((x) => x.datum)).toEqual(['2026-04-20', '2026-07-20'])
    expect(p[0].betroffen).toBeCloseTo((40 * 9.81) / 70, 6)
    expect(p[1].zweites).toBeCloseTo(90, 6)
    expect(p.map((x) => x.phase)).toEqual(['mitte', 'spaet'])
  })

  it('CMJ: Höhe als ein Wert, Asymmetrie als zweites Diagramm; Contraction Time eigens wählbar', () => {
    expect(verlaufsDaten(patient, testungen, option('cmj'))).toMatchObject([{ wert: 31 }])
    expect(verlaufsDaten(patient, testungen, option('cmj:ct'))).toMatchObject([{ wert: 820 }])
  })

  it('bietet nur Größen mit Werten an', () => {
    expect(verfuegbareOptionen(patient, testungen).map((o) => o.id)).toEqual(['hhd_knie_ext', 'cmj', 'cmj:ct'])
  })

  it('Punkte tragen die tatsächliche Ampel des Kriteriums', () => {
    const p = verlaufsDaten(patient, testungen, option('hhd_knie_ext'))
    // Mitte: 40 kg → 5,6 N/kg < 7,0 → nicht erfüllt; LSI 72,7 % → nicht erfüllt
    expect(p[0]).toMatchObject({ ampelWert: 'rot', ampelZweites: 'rot' })
    // Spät: LSI 90 % → erfüllt
    expect(p[1].ampelZweites).toBe('gruen')
    // Strategy-Werte haben keine Ampel
    expect(verlaufsDaten(patient, testungen, option('cmj:ct'))[0].ampelWert).toBeNull()
  })

  it('Zielkorridor aus den Schwellen je Phase (config), nichts Neues', () => {
    const k = zielkorridor(kriterienFuer(option('hhd_knie_ext')).wert)
    expect(k?.richtung).toBe('oben')
    expect(k?.stufen).toEqual([
      { von: 0, bis: 3, wert: 5.5 },
      { von: 3, bis: 5, wert: 7 },
      { von: 5, bis: null, wert: 7.5 },
    ])
    expect(zielkorridor(kriterienFuer(option('hhd_knie_ext')).zweites)?.stufen).toEqual([{ von: 0, bis: null, wert: 90 }])
    // LSI-Bereich nach oben bis 110 % (Audit Punkt 24), Absolutwerte nach oben offen
    const lsi = zielkorridor(kriterienFuer(option('hhd_knie_ext')).zweites)
    expect(lsi?.grenze).toBe(110)
    expect(lsi?.text).toBe('Ziel: LSI ab 90 % (Bereich bis 110 % markiert)')
    expect(k?.grenze).toBeNull()
    // Hops haben nur ein LSI-Ziel, kein Absolutziel
    expect(kriterienFuer(option('single_hop')).wert).toBeUndefined()
  })

  it('zeigt fehlende Messungen nur für Tests im Testset', () => {
    const f = fehlendeMessungen(patient, testungen, option('cmj'))
    // CMJ gehört zum Testset „Mitte“, wurde dort aber nicht gemessen
    expect(f.map((x) => x.datum)).toEqual(['2026-04-20'])
    expect(f[0].genau).toBeGreaterThan(3)
  })

  it('Phasenbänder ab OP-Datum', () => {
    const b = phasenBaender('2026-01-15')
    expect(b.map((x) => x.name)).toEqual(['Früh', 'Mitte', 'Spät', '8–9 Mo', '> 9 Mo'])
    expect(b[1].von.getMonth()).toBe(3) // April
    expect(b[4].bis).toBeNull()
  })
})
