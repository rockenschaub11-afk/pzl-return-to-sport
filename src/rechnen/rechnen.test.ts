import { describe, expect, it } from 'vitest'
import { alsNewton, kgZuN, nmProKg, nProKg, nsProKg, nZuKg } from './einheiten'
import { asymmetrie, bestwert, gerundet, lsi, streuungZuHoch, variationskoeffizient } from './versuche'

describe('Einheiten', () => {
  it('rechnet kg in N und zurück (× 9,81)', () => {
    expect(kgZuN(10)).toBeCloseTo(98.1, 6)
    expect(nZuKg(98.1)).toBeCloseTo(10, 6)
    expect(alsNewton(10, 'kg')).toBeCloseTo(98.1, 6)
    expect(alsNewton(98.1, 'N')).toBe(98.1)
  })

  it('rechnet relative Kraft und Drehmoment', () => {
    expect(nProKg(600, 80)).toBe(7.5)
    expect(nmProKg(400, 0.35, 70)).toBeCloseTo(2, 6)
  })

  it('rechnet Meloq Net Impulse in Ns/kg (Beispiel aus ENTSCHEIDUNGEN 6.2)', () => {
    expect(gerundet(nsProKg(13.3, 59.15), 2)).toBe(2.21)
  })
})

describe('Versuche', () => {
  it('nimmt den Bestwert – bei Zeittests den kleinsten', () => {
    expect(bestwert([210, 225, 218])).toBe(225)
    expect(bestwert([2.31, 2.18, 2.25], true)).toBe(2.18)
    expect(bestwert([null, 180, undefined])).toBe(180)
    expect(bestwert([])).toBeNull()
  })

  it('rechnet den Variationskoeffizienten (Stichprobe)', () => {
    // Mittel 20, SD 2 → 10 %
    expect(variationskoeffizient([18, 20, 22])).toBeCloseTo(10, 6)
    expect(variationskoeffizient([20])).toBeNull()
  })

  it('warnt erst bei mehr als 10 % Streuung', () => {
    expect(streuungZuHoch([18, 20, 22], 10)).toBe(false) // genau 10 %
    expect(streuungZuHoch([17, 20, 23], 10)).toBe(true)
    expect(streuungZuHoch([20], 10)).toBe(false)
  })
})

describe('Seitenvergleich', () => {
  it('LSI = betroffen / gesund × 100', () => {
    expect(lsi(450, 500)).toBe(90)
  })

  it('LSI bei Zeittests = gesund / betroffen × 100', () => {
    expect(lsi(2.5, 2.25, true)).toBe(90)
  })

  it('LSI ohne gültigen Vergleichswert ist leer', () => {
    expect(lsi(450, 0)).toBeNull()
    expect(lsi(Number.NaN, 500)).toBeNull()
  })

  it('Asymmetrie wie Meloq: (stärker − schwächer) / stärker', () => {
    expect(asymmetrie(100, 90)).toBe(10)
    expect(asymmetrie(90, 100)).toBe(10)
    expect(asymmetrie(0, 0)).toBeNull()
  })

  it('rundet auf die angezeigten Stellen', () => {
    expect(gerundet(89.96, 1)).toBe(90)
    expect(gerundet(89.94, 1)).toBe(89.9)
  })
})
