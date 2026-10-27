import { describe, expect, it } from 'vitest'
import { stammdatenHinweise } from './stammdatenHinweise'

describe('Hinweise aus den Stammdaten (Etappe 12)', () => {
  it('Hamstring-Graft: bei allen Knie-Flexions-Tests', () => {
    const p = { graft: 'hamstring' as const, begleitOps: [] }
    for (const id of ['hhd_knie_flex', 'hhd_knie_flex_60', 'hhd_knie_flex_30']) expect(stammdatenHinweise(id, p)[0]).toContain('Hamstring-Graft')
    expect(stammdatenHinweise('hhd_knie_ext', p)).toEqual([])
  })

  it('BPTB-Graft: Knie-Extension und CMJ', () => {
    const p = { graft: 'bptb' as const, begleitOps: [] }
    expect(stammdatenHinweise('hhd_knie_ext', p)[0]).toContain('Quadrizeps')
    expect(stammdatenHinweise('cmj', p)[0]).toContain('langsamer')
    expect(stammdatenHinweise('hhd_knie_flex', p)).toEqual([])
  })

  it('SL-Squat nach Meniskus-OP und/oder LET', () => {
    expect(stammdatenHinweise('sl_squat', { graft: '', begleitOps: ['meniskus', 'let'] })[0]).toContain('Nach Meniskus-OP und LET')
    expect(stammdatenHinweise('sl_squat', { graft: '', begleitOps: ['let'] })[0]).toContain('Nach LET')
    expect(stammdatenHinweise('sl_squat', { graft: '', begleitOps: ['knorpel'] })).toEqual([])
  })
})
