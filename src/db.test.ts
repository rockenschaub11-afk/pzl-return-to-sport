import { beforeEach, describe, expect, it } from 'vitest'
import { db, findeKuerzel, KuerzelVergebenFehler, loeschePatient, neueTestung, speicherePatient, speichereTestung, TestungKonfliktFehler } from './db'
import { LEER, type Stammdaten } from './patienten/stammdaten'

const daten: Stammdaten = { ...LEER, kuerzel: 'mh-1998', seite: 'rechts', opDatum: '2025-12-01', niveau: 'freizeit' }

describe('Speicher', () => {
  beforeEach(async () => {
    await db.patienten.clear()
    await db.testungen.clear()
  })

  it('speichert ein Kürzel normalisiert und findet es wieder', async () => {
    const id = await speicherePatient(daten)
    const p = await findeKuerzel('MH-1998')
    expect(p?.id).toBe(id)
    expect(p?.kuerzel).toBe('MH-1998')
  })

  it('verhindert doppelte Kürzel', async () => {
    await speicherePatient(daten)
    await expect(speicherePatient({ ...daten, kuerzel: 'MH-1998 ' })).rejects.toBeInstanceOf(KuerzelVergebenFehler)
  })

  it('legt eine Endtestung an und löscht sie mit dem Kürzel', async () => {
    const id = await speicherePatient(daten)
    const testungId = await neueTestung(id, '2026-10-26', 'rtc')
    expect((await db.testungen.get(testungId))?.status).toBe('in_arbeit')
    await loeschePatient(id)
    expect(await db.testungen.count()).toBe(0)
  })

  it('überschreibt keine Testung, die inzwischen woanders geändert wurde', async () => {
    const id = await speicherePatient(daten)
    const t = (await db.testungen.get(await neueTestung(id, '2026-10-26', 'rtc')))!
    // Fenster A und B öffnen denselben Stand; A speichert zuerst
    const nachA = await speichereTestung({ ...t, koerpergewichtKg: '80' }, t.geaendertAm)
    await expect(speichereTestung({ ...t, koerpergewichtKg: '70' }, t.geaendertAm)).rejects.toBeInstanceOf(TestungKonfliktFehler)
    expect((await db.testungen.get(t.id))?.koerpergewichtKg).toBe('80')
    // A kann auf seinem eigenen Stand weiterspeichern
    await speichereTestung({ ...t, koerpergewichtKg: '81' }, nachA)
    expect((await db.testungen.get(t.id))?.koerpergewichtKg).toBe('81')
    // gelöscht in einem anderen Fenster: nicht wieder anlegen
    await db.testungen.delete(t.id)
    await expect(speichereTestung(t, nachA)).rejects.toBeInstanceOf(TestungKonfliktFehler)
    expect(await db.testungen.count()).toBe(0)
  })

  it('erlaubt Änderungen am eigenen Eintrag', async () => {
    const id = await speicherePatient(daten)
    await speicherePatient({ ...daten, sportart: 'Handball' }, id)
    expect(await db.patienten.count()).toBe(1)
    expect((await db.patienten.get(id))?.sportart).toBe('Handball')
  })
})
