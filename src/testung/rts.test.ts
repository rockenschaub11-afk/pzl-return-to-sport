import { describe, expect, it } from 'vitest'
import type { Testung } from '../db'
import { LEER, type Patient } from '../patienten/stammdaten'
import { werteAus } from './ablauf'
import { rtsVorschlag } from './rts'

// Alle Pflicht-Tests grün (Körpergewicht 70 kg)
const GRUEN: Testung['eingaben'] = {
  erguss: { wert: '0' },
  rom_extension: { wert: '0' },
  rom_flexion: { g: '140', b: '138' },
  slr: { wert: 'ja' },
  hhd_knie_ext: { g1: '60', b1: '58' }, // 8,1 N/kg, LSI 96,7 %
  hhd_knie_flex: { g1: '25', b1: '24' }, // 3,4 N/kg
  cmj: { v1_hoehe: '36', v1_impL: '13', v1_impR: '12,5' },
  sl_cmj: { g1_hoehe: '20', b1_hoehe: '19' },
  sl_dj: { g1_hoehe: '19', b1_hoehe: '18' },
  single_hop: { g1: '150', b1: '145' },
  triple_hop: { g1: '450', b1: '430' },
  crossover_hop: { g1: '400', b1: '390' },
  timed_hop: { g1: '2,2', b1: '2,3' },
  acl_rsi: { wert: '70' },
}

const patient: Pick<Patient, 'opDatum' | 'niveau' | 'konservativ' | 'geschlecht'> = { ...LEER, opDatum: '2025-10-01', niveau: 'wettkampf', konservativ: false, geschlecht: 'maennlich' }

function vorschlag(eingaben: Testung['eingaben'], extra: Partial<Testung> = {}, p = patient) {
  const testung = { datum: '2026-08-01', optionaleTests: [], koerpergewichtKg: '70', eingaben, ...extra }
  return rtsVorschlag(testung, p, werteAus(testung, p.geschlecht))
}

describe('RTS-Vorschlag', () => {
  it('Kriterien erfüllt: alle Pflicht-Tests grün und ≥ 9 Monate', () => {
    const v = vorschlag(GRUEN)
    expect(v.wasFehlt).toEqual([])
    expect(v.erfuellt).toBe(true)
    expect(v.monate).toBe(10)
    expect(v.pflicht.map((p) => p.test.id)).toEqual(
      expect.arrayContaining(['erguss', 'hhd_knie_ext', 'cmj', 'sl_cmj', 'sl_dj', 'single_hop', 'timed_hop']),
    )
  })

  it('9-Monats-Regel: gezählt bis zum Datum der Testung', () => {
    const v = vorschlag(GRUEN, { datum: '2026-06-15' })
    expect(v.erfuellt).toBe(false)
    expect(v.zeitErfuellt).toBe(false)
    expect(v.wasFehlt[0]).toMatch(/^Zeit seit OP: 8 Monate – mindestens 9 Monate/)
  })

  it('gelb zählt als nicht erfüllt – mit Grund in „Was fehlt noch?“', () => {
    const v = vorschlag({ ...GRUEN, hhd_knie_ext: { g1: '70', b1: '59,5' } }) // 8,3 N/kg, LSI 85 %
    expect(v.erfuellt).toBe(false)
    expect(v.wasFehlt).toEqual(['Knie-Extension (HHD): LSI 85,0 % – Ziel ≥ 90 %'])
  })

  it('fehlender Pflicht-Test: „noch nicht gemessen“', () => {
    const { single_hop: _weg, ...ohne } = GRUEN
    const v = vorschlag(ohne)
    expect(v.erfuellt).toBe(false)
    expect(v.wasFehlt).toEqual(['Single Hop: noch nicht gemessen'])
  })

  it('wünschenswerte Kriterien blockieren nicht, werden aber aufgelistet', () => {
    const v = vorschlag({ ...GRUEN, cmj: { v1_hoehe: '30', v1_impL: '13', v1_impR: '12,5' } })
    expect(v.erfuellt).toBe(true)
    expect(v.wuenschenswertNichtErreicht).toEqual(['CMJ: Sprunghöhe 30,0 cm – Ziel > 33,9 cm'])
  })

  it('Frauen: Read-Absolutwert nicht erreicht blockiert nicht', () => {
    const frau = { ...patient, geschlecht: 'weiblich' as const }
    const v = vorschlag({ ...GRUEN, hhd_knie_ext: { g1: '52', b1: '50' } }, {}, frau) // 7,0 N/kg, LSI 96 %
    expect(v.erfuellt).toBe(true)
    const mann = vorschlag({ ...GRUEN, hhd_knie_ext: { g1: '52', b1: '50' } })
    expect(mann.erfuellt).toBe(false)
  })

  it('klinisch anders beurteilt zählt nur mit Begründung', () => {
    const rot = { ...GRUEN, timed_hop: { g1: '2,2', b1: '2,8' } }
    expect(vorschlag(rot, { klinischAnders: { timed_hop: { urteil: 'erfuellt', begruendung: '' } } }).erfuellt).toBe(false)
    const v = vorschlag(rot, { klinischAnders: { timed_hop: { urteil: 'erfuellt', begruendung: 'Messfehler, Ausrutscher' } } })
    expect(v.erfuellt).toBe(true)
    expect(v.pflicht.find((p) => p.test.id === 'timed_hop')).toMatchObject({ ampelStatus: 'nicht_erfuellt', status: 'erfuellt' })
    expect(v.hinweise).toContain('Mindestens ein Test wurde klinisch anders beurteilt (mit Begründung).')
  })

  it('klinisch als nicht erfüllt beurteilt erscheint in „Was fehlt noch?“', () => {
    const v = vorschlag(GRUEN, { klinischAnders: { erguss: { urteil: 'nicht_erfuellt', begruendung: 'deutliche Schwellung nach Belastung' } } })
    expect(v.erfuellt).toBe(false)
    expect(v.wasFehlt).toEqual(['Erguss (Stroke-Test): klinisch als nicht erfüllt beurteilt – deutliche Schwellung nach Belastung'])
  })

  it('ACL-RSI unter 55: eigene Warnung, blockiert nicht', () => {
    const v = vorschlag({ ...GRUEN, acl_rsi: { wert: '48' } })
    expect(v.erfuellt).toBe(true)
    expect(v.aclRsiWarnung).toMatch(/^ACL-RSI 48 Punkte – unter 55/)
  })

  it('Freizeit-Niveau: Hinweis auf 12 Monate, blockiert nicht', () => {
    const v = vorschlag(GRUEN, {}, { ...patient, niveau: 'freizeit' })
    expect(v.erfuellt).toBe(true)
    expect(v.hinweise[0]).toContain('12 Monate')
  })
})
