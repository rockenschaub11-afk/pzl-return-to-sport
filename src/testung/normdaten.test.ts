import { describe, expect, it } from 'vitest'
import { KATALOG } from '../katalog'
import { altersband, NORMDATEN, normdatenFuer, normzeitpunkt } from './normdaten'

const mann25 = { geschlecht: 'maennlich' as const, geburtsjahr: '2001' }

describe('Normdaten (config/normdaten.json)', () => {
  it('verweist nur auf Tests, die es im Katalog gibt', () => {
    const ids = new Set(KATALOG.tests.map((t) => t.id))
    for (const g of NORMDATEN.gruppen) for (const w of g.werte) expect(ids.has(w.test), w.test).toBe(true)
  })

  it('Altersband über das Geburtsjahr', () => {
    expect(altersband('2001', '2026-10-26')).toBe('20-30')
    expect(altersband('2008', '2026-10-26')).toBe('16-20')
    expect(altersband('1990', '2026-10-26')).toBeNull()
  })

  it('nächster Zeitpunkt nur innerhalb ±1,5 Monate', () => {
    expect(normzeitpunkt(6)).toBe(6)
    expect(normzeitpunkt(7)).toBe(6)
    expect(normzeitpunkt(8)).toBe(9)
    expect(normzeitpunkt(4)).toBeNull()
    expect(normzeitpunkt(14)).toBeNull()
  })
})

describe('Anzeige je Test', () => {
  it('passende Gruppe: Werte mit Bereich', () => {
    const n = normdatenFuer('cmj', mann25, '2026-10-26', 6)!
    expect(n.kopf).toBe('Typisch nach VKB-OP (6 Mo, männlich 20–30)')
    expect(n.zeilen).toEqual(['Sprunghöhe: 29,7 cm (±1 SD 24,6–34,8)'])
  })

  it('SL-Drop-Jump: immer mit Hinweis auf die 15-cm-Box', () => {
    const n = normdatenFuer('sl_dj', mann25, '2026-10-26', 9)!
    expect(n.zeilen).toContain('Sprunghöhe betroffen: 9,2 cm')
    expect(n.hinweis).toContain('15-cm-Box')
  })

  it('keine genaue Gruppe → nichts Falsches, sondern ein Grund', () => {
    expect(normdatenFuer('cmj', { geschlecht: 'weiblich', geburtsjahr: '2001' }, '2026-10-26', 6)?.keine).toMatch(/keine Werte zu diesem Test/)
    expect(normdatenFuer('cmj', { geschlecht: '', geburtsjahr: '2001' }, '2026-10-26', 6)?.keine).toMatch(/Geschlecht/)
    expect(normdatenFuer('cmj', { geschlecht: 'maennlich', geburtsjahr: '' }, '2026-10-26', 6)?.keine).toMatch(/Geburtsjahr/)
    expect(normdatenFuer('cmj', mann25, '2026-10-26', 3)?.keine).toMatch(/6, 9 und 12 Monate/)
  })

  it('Tests ohne Normdaten zeigen gar nichts', () => {
    expect(normdatenFuer('hhd_knie_ext', mann25, '2026-10-26', 6)).toBeNull()
  })

  it('CMJ 12 Mo, m 20–30: VKB-Gruppe und Vergleichsgruppe ohne Verletzung (Report S. 37)', () => {
    expect(normdatenFuer('cmj', mann25, '2026-10-26', 12)?.zeilen).toEqual([
      'Sprunghöhe: 30,7 cm (±1 SD 26,1–35,3)',
      'Vergleich ohne Verletzung – Sprunghöhe: 34,5 cm (±1 SD 30,5–38,5)',
    ])
  })

  it('CMJ 9 Mo, m 20–30: mit Bereich (Report S. 26)', () => {
    expect(normdatenFuer('cmj', mann25, '2026-10-26', 9)?.zeilen[0]).toBe('Sprunghöhe: 29,7 cm (±1 SD 24,3–35,1)')
  })
})
