import { describe, expect, it } from 'vitest'
import type { KriteriumErgebnis, TestErgebnis } from '../rechnen/bewertung'
import { istKeineZahl } from './erfassung'
import { kartenStatus } from './kartenStatus'

const k = (status: string, ampel: 'gruen' | 'gelb' | 'rot' | undefined, zustand: KriteriumErgebnis['zustand'] = 'bewertet') =>
  ({ kriterium: { status }, ampel, zustand, zaehlt: true }) as unknown as KriteriumErgebnis
const test = (kriterien: KriteriumErgebnis[], vollstaendig = true) => ({ kriterien, vollstaendig, hinweise: [], ampel: null }) as unknown as TestErgebnis

describe('Status der Testkarte', () => {
  it('zählt nur Pflicht: wünschenswert verfehlt färbt die Karte nicht rot, wird aber genannt', () => {
    const s = kartenStatus(test([k('pflicht', 'gruen'), k('wuenschenswert', 'rot')]), true)
    expect(s).toMatchObject({ ampel: 'gruen', text: 'erfüllt', wuenschenswertOffen: true, ruhig: false })
  })

  it('Pflicht knapp bleibt knapp', () => {
    expect(kartenStatus(test([k('pflicht', 'gruen'), k('pflicht', 'gelb')]), true)).toMatchObject({ ampel: 'gelb', text: 'knapp' })
  })

  it('nur wünschenswerte Kriterien: verfehlt ist neutral markiert, nicht als Ampel', () => {
    expect(kartenStatus(test([k('wuenschenswert', 'gelb')]), true)).toMatchObject({ ampel: null, text: '~ wünschenswert' })
    expect(kartenStatus(test([k('wuenschenswert', 'gruen')]), true)).toMatchObject({ ampel: 'gruen', text: 'erfüllt', ruhig: true })
  })

  it('Fragebogen mit Wert ist nie „offen“: Warnung oder erfasst', () => {
    expect(kartenStatus(test([k('warnung', 'gelb')]), true)).toMatchObject({ ampel: 'gelb', text: 'Warnung', ruhig: false })
    expect(kartenStatus(test([k('warnung', 'gruen')]), true)).toMatchObject({ ampel: null, text: 'erfasst', ruhig: true })
    expect(kartenStatus(test([k('info', undefined, 'info')]), true)).toMatchObject({ ampel: null, text: 'erfasst', ruhig: true })
  })

  it('ohne Eingabe offen; unvollständig bleibt sichtbar', () => {
    expect(kartenStatus(test([k('pflicht', undefined, 'offen')]), false)).toMatchObject({ text: 'offen', ruhig: false })
    expect(kartenStatus(test([k('pflicht', 'gruen'), k('pflicht', undefined, 'offen')], false), true)).toMatchObject({ text: 'erfüllt (unvollständig)', ruhig: false })
  })
})

describe('Eingabe prüfen', () => {
  it('meldet nur echte Nicht-Zahlen', () => {
    expect(istKeineZahl('abc')).toBe(true)
    expect(istKeineZahl('12x')).toBe(true)
    for (const gut of ['', ' ', '-', ',', '12', '12,5', '12.5', '-3', undefined]) expect(istKeineZahl(gut)).toBe(false)
  })
})
