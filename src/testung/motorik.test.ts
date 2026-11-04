import { describe, expect, it } from 'vitest'
import { MOTOR, motorTestNach, pruefeMotor } from '../katalog/motorcontrol'
import { kompensationenText, motorBewertungen, score, scoreKurz, seitenunterschied } from './motorik'

const bewertet = (...kompensationen: string[]) => ({ status: 'bewertet' as const, kompensationen })

describe('Motor Control – Score nach Aspetar', () => {
  it('ein Punkt je Segment ohne Kompensation', () => {
    expect(score(bewertet())).toBe(3)
    expect(score(bewertet('knie:valgus'))).toBe(2)
    // zwei Kompensationen im selben Segment = ein auffälliges Segment
    expect(score(bewertet('knie:valgus', 'knie:varus'))).toBe(2)
    expect(score(bewertet('fuss:kollaps', 'knie:valgus'))).toBe(1)
    expect(score(bewertet('fuss:kollaps', 'knie:valgus', 'rumpf:vorne'))).toBe(0)
  })

  it('nicht verlässlich durchführbar = 0/3, nicht bewertet = kein Score', () => {
    expect(score({ status: 'nicht_durchfuehrbar', kompensationen: [] })).toBe(0)
    expect(score(undefined)).toBeNull()
  })

  it('Hinweis nur, wenn die betroffene Seite weniger Punkte hat', () => {
    expect(seitenunterschied({ b: bewertet('knie:valgus'), g: bewertet() })).toBe(true)
    expect(seitenunterschied({ b: bewertet(), g: bewertet('knie:valgus') })).toBe(false)
    expect(seitenunterschied({ b: bewertet(), g: bewertet() })).toBe(false)
    expect(seitenunterschied({ b: bewertet('knie:valgus') })).toBe(false)
  })

  it('Kurzform und Kompensationen in Worten', () => {
    const sl = motorTestNach('mc_sl_squat')!
    expect(scoreKurz(sl, { b: bewertet('knie:valgus', 'rumpf:seite'), g: bewertet() })).toBe('b 1/3 · g 3/3')
    expect(scoreKurz(motorTestNach('mc_dl_calf')!, { v: bewertet('rumpf:becken') })).toBe('2/3')
    expect(kompensationenText(sl, bewertet('knie:valgus', 'rumpf:seite'))).toEqual(['Knie: Valgus', 'Hüfte / Rumpf: Rumpf weicht zur Seite aus'])
  })

  it('nur bewertete oder kommentierte Tests in Katalog-Reihenfolge', () => {
    const liste = motorBewertungen({ motorControl: { mc_sl_calf: { v: undefined, text: 'Ferse kippt' }, mc_dl_squat: { v: bewertet() }, mc_sl_rdl: {} } })
    expect(liste.map((x) => x.def.id)).toEqual(['mc_dl_squat', 'mc_sl_calf'])
  })
})

describe('motorcontrol.json', () => {
  it('ist fehlerfrei und enthält die sechs freigegebenen Tests', () => {
    expect(pruefeMotor(MOTOR)).toEqual([])
    expect(MOTOR.tests.map((t) => t.id)).toEqual(['mc_dl_squat', 'mc_sl_squat', 'mc_front_squat', 'mc_sl_rdl', 'mc_dl_calf', 'mc_sl_calf'])
  })

  it('meldet unbekannte Liste und fehlende Kompensationen', () => {
    const kaputt = { ...MOTOR, tests: [...MOTOR.tests, { id: 'x', name: 'X', einbeinig: false, liste: 'gibtsnicht', quelle: '' }], listen: { ...MOTOR.listen, calf: { ...MOTOR.listen.calf, knie: [] } } }
    const fehler = pruefeMotor(kaputt)
    expect(fehler).toContainEqual(expect.stringMatching(/unbekannte Liste/))
    expect(fehler).toContainEqual(expect.stringMatching(/calf: Segment knie ohne Kompensationen/))
  })
})
