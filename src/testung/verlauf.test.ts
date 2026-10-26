import { describe, expect, it } from 'vitest'
import type { Testung } from '../db'
import { phasenBaender, verfuegbareOptionen, VERLAUF_OPTIONEN, verlaufsDaten } from './verlauf'

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

  it('Phasenbänder ab OP-Datum', () => {
    const b = phasenBaender('2026-01-15')
    expect(b.map((x) => x.name)).toEqual(['Früh', 'Mitte', 'Spät', '8–9 Mo', '> 9 Mo'])
    expect(b[1].von.getMonth()).toBe(3) // April
    expect(b[4].bis).toBeNull()
  })
})
