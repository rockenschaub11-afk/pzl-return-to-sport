import { describe, expect, it } from 'vitest'
import { wertBei } from './kurven'

const punkte = [
  [0, 0],
  [1, 100],
  [2, 50],
] as const

describe('Modellkurven', () => {
  it('trifft die Stützpunkte genau und hält die Ränder', () => {
    expect(wertBei(punkte, 1)).toBe(100)
    expect(wertBei(punkte, -1)).toBe(0)
    expect(wertBei(punkte, 5)).toBe(50)
  })

  it('interpoliert weich zwischen zwei Punkten', () => {
    expect(wertBei(punkte, 0.5)).toBeCloseTo(50, 6)
    expect(wertBei(punkte, 0.25)).toBeLessThan(25) // Kosinus: langsamer Anfang
  })
})
