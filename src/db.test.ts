import { beforeEach, describe, expect, it } from 'vitest'
import { db, findeKuerzel, KuerzelVergebenFehler, speicherePatient } from './db'
import { LEER, type Stammdaten } from './patienten/stammdaten'

const daten: Stammdaten = { ...LEER, kuerzel: 'mh-1998', seite: 'rechts', opDatum: '2025-12-01', niveau: 'freizeit' }

describe('Speicher', () => {
  beforeEach(async () => {
    await db.patienten.clear()
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

  it('erlaubt Änderungen am eigenen Eintrag', async () => {
    const id = await speicherePatient(daten)
    await speicherePatient({ ...daten, sportart: 'Handball' }, id)
    expect(await db.patienten.count()).toBe(1)
    expect((await db.patienten.get(id))?.sportart).toBe('Handball')
  })
})
