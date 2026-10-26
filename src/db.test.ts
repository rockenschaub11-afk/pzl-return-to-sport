import { beforeEach, describe, expect, it } from 'vitest'
import { db, findeKuerzel, KuerzelVergebenFehler, loeschePatient, neueTestung, speicherePatient } from './db'
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

  it('erlaubt Änderungen am eigenen Eintrag', async () => {
    const id = await speicherePatient(daten)
    await speicherePatient({ ...daten, sportart: 'Handball' }, id)
    expect(await db.patienten.count()).toBe(1)
    expect((await db.patienten.get(id))?.sportart).toBe('Handball')
  })
})
