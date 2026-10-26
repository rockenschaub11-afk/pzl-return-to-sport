import { describe, expect, it } from 'vitest'
import { FRAGEBOEGEN } from './fragebogen'

const alle = (ids: string[], wert: string): Record<string, string> => Object.fromEntries(ids.map((id) => [`f_${id}`, wert]))
const ids = (fb: string) => FRAGEBOEGEN[fb].gruppen.flatMap((g) => g.items.map((i) => i.id))

describe('ACL-RSI', () => {
  it('Mittelwert der 12 Items', () => {
    const a = { ...alle(ids('acl_rsi'), '60'), f_1: '0', f_2: '120' }
    expect(FRAGEBOEGEN.acl_rsi.rechne(a).werte[0].score).toBeNull() // 120 ungültig → fehlt
    const b = { ...alle(ids('acl_rsi'), '60'), f_1: '0' }
    expect(FRAGEBOEGEN.acl_rsi.rechne(b).werte[0].score).toBe(55)
  })
})

describe('IKDC', () => {
  it('bestes Ergebnis = 100 (Items 2/3 umgedreht, 6 = Nein)', () => {
    const a = { ...alle(ids('ikdc'), '4'), f_2: '0', f_3: '0', f_6: 'nein', f_10b: '10' }
    expect(FRAGEBOEGEN.ikdc.rechne(a).werte[0].score).toBe(100)
  })

  it('Rohsumme / Maximum der beantworteten × 100, höchstens 2 fehlend', () => {
    const a: Record<string, string> = { ...alle(ids("ikdc"), "2"), f_2: "5", f_3: "5", f_6: "ja", f_10b: "5" }
    // 14 Items à 2 von 4 (28/56) + 2/3: je 5/10 + 6: 0/1 + 10b: 5/10 → 43 / 87
    expect(FRAGEBOEGEN.ikdc.rechne(a).werte[0].score).toBeCloseTo((43 / 87) * 100, 6)
    const { f_1: _a, f_9a: _b, ...zweiFehlen } = a
    expect(FRAGEBOEGEN.ikdc.rechne(zweiFehlen).werte[0].score).toBeCloseTo((39 / 79) * 100, 6)
    const { f_5: _c, ...dreiFehlen } = zweiFehlen
    expect(FRAGEBOEGEN.ikdc.rechne(dreiFehlen).werte[0].score).toBeNull()
  })
})

describe('KOOS', () => {
  it('Subskala = 100 − Mittelwert × 25, ab der Hälfte der Items', () => {
    const r = FRAGEBOEGEN.koos.rechne({ ...alle(['S1', 'S2', 'S3', 'S4'], '1'), ...alle(ids('koos').filter((i) => i.startsWith('Q')), '0') })
    expect(r.werte.map((w) => w.score)).toEqual([75, null, null, null, 100])
    expect(r.werte[0].feld).toBe('koos_symptome')
  })
})

describe('Tampa (TSK-11)', () => {
  it('Summe 11–44, Werte außerhalb 1–4 werden gemeldet', () => {
    expect(FRAGEBOEGEN.tampa.rechne(alle(ids('tampa'), '2')).werte[0].score).toBe(22)
    const r = FRAGEBOEGEN.tampa.rechne({ ...alle(ids('tampa'), '2'), f_3: '5' })
    expect(r.werte[0].score).toBeNull()
    expect(r.meldungen[0]).toContain('Item 3: 5 liegt außerhalb 1–4')
  })
})
