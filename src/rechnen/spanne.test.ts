import { describe, expect, it } from 'vitest'
import { lsiSpanne, spanne } from './spanne'

describe('spanne', () => {
  it('kleinster und größter Versuch', () => {
    expect(spanne([180, 172, null])).toEqual([172, 180])
  })

  it('ein Versuch ist keine Spanne', () => {
    expect(spanne([180, null, undefined])).toBeNull()
  })
})

describe('lsiSpanne', () => {
  it('alle Kombinationen betroffen gegen gesund', () => {
    // 80/110 … 90/100
    const s = lsiSpanne([100, 110], [80, 90])!
    expect(s[0]).toBeCloseTo((80 / 110) * 100)
    expect(s[1]).toBeCloseTo(90)
  })

  it('Zeittest umgekehrt: gesund / betroffen', () => {
    const s = lsiSpanne([2, 2.2], [2.5], true)!
    expect(s[0]).toBeCloseTo(80)
    expect(s[1]).toBeCloseTo(88)
  })

  it('je Seite nur ein Versuch: keine Spanne', () => {
    expect(lsiSpanne([100], [80])).toBeNull()
    expect(lsiSpanne([], [80, 90])).toBeNull()
  })
})
