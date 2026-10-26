import { beforeEach, describe, expect, it } from 'vitest'
import { beispielAnlegen } from '../beispiel'
import { db } from '../db'
import { entschluesseln, huelleLesen, KeineSicherungsdateiFehler, PasswortFalschFehler, verschluesseln } from './krypto'
import {
  gesamtExportieren,
  gesamtZusammenfuehren,
  inhaltPruefen,
  kuerzelExportieren,
  kuerzelImportieren,
  kuerzelVorschau,
  sicherungsStand,
} from './sicherung'

// wenige Runden, damit die Tests schnell sind – die App nutzt STANDARD_RUNDEN
const R = 1000
const PW = 'geheim-123'

let patientId: string
beforeEach(async () => {
  await db.patienten.clear()
  await db.testungen.clear()
  await db.einstellungen.clear()
  patientId = await beispielAnlegen()
})

describe('Verschlüsselung', () => {
  it('liest nur mit dem richtigen Passwort; die Hülle verrät keine Inhalte', async () => {
    const text = await verschluesseln({ kuerzel: 'DEMO-1990' }, PW, 'kuerzel', R)
    expect(text).not.toContain('DEMO')
    expect(huelleLesen(text)).toMatchObject({ art: 'kuerzel', format: 'pzl-return-to-sport' })
    expect((await entschluesseln(text, PW)).inhalt).toEqual({ kuerzel: 'DEMO-1990' })
    await expect(entschluesseln(text, 'falsches-pw')).rejects.toBeInstanceOf(PasswortFalschFehler)
  })

  it('verlangt ein Passwort mit mindestens 8 Zeichen und erkennt fremde Dateien', async () => {
    await expect(verschluesseln({}, 'kurz', 'gesamt', R)).rejects.toThrow(/mindestens 8/)
    expect(() => huelleLesen('{"hallo":1}')).toThrow(KeineSicherungsdateiFehler)
  })
})

describe('Kürzel übergeben', () => {
  it('Export enthält das Kürzel mit allen Testungen, Dateiname ohne Namen', async () => {
    const { dateiname, text } = await kuerzelExportieren(patientId, PW, R)
    expect(dateiname).toMatch(/^PZL-DEMO-1990-\d{4}-\d{2}-\d{2}\.pzlrts$/)
    const inhalt = inhaltPruefen((await entschluesseln(text, PW)).inhalt, 'kuerzel')
    expect(inhalt.patienten).toHaveLength(1)
    expect(inhalt.testungen).toHaveLength(3)
  })

  it('gleiches Kürzel: nachfragen, dann ersetzen oder als …-2 anlegen', async () => {
    const { text } = await kuerzelExportieren(patientId, PW, R)
    const inhalt = inhaltPruefen((await entschluesseln(text, PW)).inhalt, 'kuerzel')
    const v = await kuerzelVorschau(inhalt)
    expect(v.vorhanden?.testungen).toBe(3)
    expect(v.ausweich).toBe('DEMO-1990-2')
    await expect(kuerzelImportieren(inhalt, null)).rejects.toThrow(/Bitte wählen/)

    await kuerzelImportieren(inhalt, 'neu')
    expect((await db.patienten.toArray()).map((p) => p.kuerzel).sort()).toEqual(['DEMO-1990', 'DEMO-1990-2'])
    expect(await db.testungen.count()).toBe(6)

    await kuerzelImportieren(inhalt, 'ersetzen')
    expect(await db.patienten.count()).toBe(2)
    expect(await db.testungen.count()).toBe(6)
  })

  it('ohne Konflikt wird das Kürzel einfach angelegt', async () => {
    const { text } = await kuerzelExportieren(patientId, PW, R)
    await db.patienten.clear()
    await db.testungen.clear()
    await kuerzelImportieren(inhaltPruefen((await entschluesseln(text, PW)).inhalt, 'kuerzel'), null)
    expect(await db.patienten.count()).toBe(1)
    expect(await db.testungen.count()).toBe(3)
  })
})

describe('Gesamtsicherung', () => {
  it('führt zusammen: Fehlendes kommt dazu, Neueres gewinnt, nichts wird gelöscht', async () => {
    await db.einstellungen.put({ id: 'therapeutKuerzel', wert: 'PR' })
    const { text, dateiname } = await gesamtExportieren(PW, R)
    expect(dateiname).toMatch(/^PZL-Sicherung-/)
    const inhalt = inhaltPruefen((await entschluesseln(text, PW)).inhalt, 'gesamt')
    expect(inhalt.einstellungen.map((e) => e.id)).toEqual(['therapeutKuerzel'])

    // Laptop ändert sich nach der Sicherung: eine Testung wird neuer, eine fehlt
    const [a, b] = await db.testungen.toArray()
    await db.testungen.put({ ...a, geaendertAm: '2999-01-01T00:00:00.000Z', tegnerAktuell: '9' })
    await db.testungen.delete(b.id)

    const vorschau = await gesamtZusammenfuehren(inhalt, true)
    expect(vorschau.testungen).toEqual({ neu: 1, aktualisiert: 0, unveraendert: 2 })
    expect(await db.testungen.count()).toBe(2) // Vorschau schreibt nichts

    await gesamtZusammenfuehren(inhalt)
    expect(await db.testungen.count()).toBe(3)
    expect((await db.testungen.get(a.id))?.tegnerAktuell).toBe('9')
  })

  it('gleiches Kürzel mit anderer id (zwei Laptops) kommt als …-2 dazu', async () => {
    const { text } = await gesamtExportieren(PW, R)
    const inhalt = inhaltPruefen((await entschluesseln(text, PW)).inhalt, 'gesamt')
    inhalt.patienten = inhalt.patienten.map((p) => ({ ...p, id: 'andere-id' }))
    inhalt.testungen = inhalt.testungen.map((t) => ({ ...t, id: `x-${t.id}`, patientId: 'andere-id' }))
    const erg = await gesamtZusammenfuehren(inhalt)
    expect(erg.patienten.umbenannt).toEqual(['DEMO-1990 → DEMO-1990-2'])
    expect(await db.patienten.count()).toBe(2)
  })

  it('Erinnerung nach 7 Tagen, nur wenn es Daten gibt', () => {
    const jetzt = new Date('2026-10-26T12:00:00Z')
    expect(sicherungsStand(undefined, 0, jetzt).faellig).toBe(false)
    expect(sicherungsStand(undefined, 1, jetzt)).toEqual({ tage: null, faellig: true })
    expect(sicherungsStand('2026-10-20T12:00:00Z', 1, jetzt)).toEqual({ tage: 6, faellig: false })
    expect(sicherungsStand('2026-10-19T12:00:00Z', 1, jetzt)).toEqual({ tage: 7, faellig: true })
  })

  it('lehnt beschädigte Inhalte ab', () => {
    expect(() => inhaltPruefen({ patienten: [{ id: 'p', kuerzel: 'A', kuerzelNorm: 'A' }], testungen: [{ id: 't', patientId: 'fremd', eingaben: {} }] }, 'gesamt')).toThrow(/beschädigt/)
  })
})
