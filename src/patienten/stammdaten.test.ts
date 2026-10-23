import { describe, expect, it } from 'vitest'
import {
  freiesKuerzel,
  kuerzelVorschlag,
  LEER,
  monateSeit,
  normalisiereKuerzel,
  passtZurSuche,
  pruefe,
  type Stammdaten,
} from './stammdaten'

const heute = new Date(2026, 9, 23) // 23.10.2026
const gueltig: Stammdaten = { ...LEER, kuerzel: 'MH-1998', seite: 'links', opDatum: '2025-12-01', niveau: 'wettkampf' }

describe('Kürzel', () => {
  it('normalisiert Groß-/Kleinschreibung und Leerzeichen', () => {
    expect(normalisiereKuerzel(' mh-1998 ')).toBe('MH-1998')
    expect(normalisiereKuerzel('m h-1998')).toBe('MH-1998')
  })

  it('schlägt Initialen-Geburtsjahr vor', () => {
    expect(kuerzelVorschlag('mh', '1998')).toBe('MH-1998')
    expect(kuerzelVorschlag('MH-1998', '1998')).toBeNull()
    expect(kuerzelVorschlag('mh', '98')).toBeNull()
  })

  it('findet das nächste freie Kürzel bei Dubletten', () => {
    expect(freiesKuerzel('MH-1998', [])).toBe('MH-1998')
    expect(freiesKuerzel('mh-1998', ['MH-1998'])).toBe('MH-1998-2')
    expect(freiesKuerzel('MH-1998', ['MH-1998', 'MH-1998-2'])).toBe('MH-1998-3')
  })
})

describe('Prüfung der Stammdaten', () => {
  it('akzeptiert vollständige Pflichtfelder', () => {
    expect(pruefe(gueltig, heute)).toEqual({})
  })

  it('meldet alle fehlenden Pflichtfelder', () => {
    const f = pruefe(LEER, heute)
    expect(Object.keys(f).sort()).toEqual(['kuerzel', 'niveau', 'opDatum', 'seite'])
  })

  it('lehnt Namen statt Kürzel ab', () => {
    expect(pruefe({ ...gueltig, kuerzel: 'Max Mustermann-Huber' }, heute).kuerzel).toBeDefined()
    expect(pruefe({ ...gueltig, kuerzel: 'MH_1998' }, heute).kuerzel).toBeDefined()
  })

  it('lehnt ein OP-Datum in der Zukunft ab', () => {
    expect(pruefe({ ...gueltig, opDatum: '2026-10-24' }, heute).opDatum).toBeDefined()
    expect(pruefe({ ...gueltig, opDatum: '2026-10-23' }, heute).opDatum).toBeUndefined()
  })

  it('prüft optionale Felder nur, wenn sie ausgefüllt sind', () => {
    expect(pruefe({ ...gueltig, geburtsjahr: '1998', beinlaengeCm: '92,5', tegner: '7' }, heute)).toEqual({})
    const f = pruefe({ ...gueltig, geburtsjahr: '2025', beinlaengeCm: '300', tegner: '11' }, heute)
    expect(Object.keys(f).sort()).toEqual(['beinlaengeCm', 'geburtsjahr', 'tegner'])
  })
})

describe('Anzeige', () => {
  it('zählt volle Monate seit OP', () => {
    expect(monateSeit('2026-01-23', heute)).toBe(9)
    expect(monateSeit('2026-01-24', heute)).toBe(8)
    expect(monateSeit('2026-10-23', heute)).toBe(0)
  })

  it('sucht in Kürzel und Sportart', () => {
    const p = { kuerzel: 'MH-1998', sportart: 'Fußball' }
    expect(passtZurSuche(p, 'mh')).toBe(true)
    expect(passtZurSuche(p, 'fuß')).toBe(true)
    expect(passtZurSuche(p, 'ski')).toBe(false)
    expect(passtZurSuche(p, '')).toBe(true)
  })
})
