import Dexie, { type EntityTable } from 'dexie'
import { normalisiereKuerzel, type Patient, type Stammdaten } from './patienten/stammdaten'

// Alle Daten liegen nur in der IndexedDB dieses Browsers – nichts verlässt den Laptop.
export const db = new Dexie('pzl-return-to-sport') as Dexie & {
  patienten: EntityTable<Patient, 'id'>
}

db.version(1).stores({
  // &kuerzelNorm = eindeutig → doppelte Kürzel sind auch in der Datenbank ausgeschlossen
  patienten: 'id, &kuerzelNorm, geaendertAm',
})

export class KuerzelVergebenFehler extends Error {
  constructor(kuerzel: string) {
    super(`Das Kürzel ${kuerzel} gibt es schon.`)
  }
}

export async function findeKuerzel(kuerzel: string): Promise<Patient | undefined> {
  return db.patienten.where('kuerzelNorm').equals(normalisiereKuerzel(kuerzel)).first()
}

export async function speicherePatient(daten: Stammdaten, id?: string): Promise<string> {
  const kuerzelNorm = normalisiereKuerzel(daten.kuerzel)
  const jetzt = new Date().toISOString()
  return db.transaction('rw', db.patienten, async () => {
    const vorhanden = await db.patienten.where('kuerzelNorm').equals(kuerzelNorm).first()
    if (vorhanden && vorhanden.id !== id) throw new KuerzelVergebenFehler(kuerzelNorm)
    const alt = id ? await db.patienten.get(id) : undefined
    const patient: Patient = {
      ...daten,
      kuerzel: kuerzelNorm,
      sportart: daten.sportart.trim(),
      begleitOpAndere: daten.begleitOpAndere.trim(),
      id: alt?.id ?? crypto.randomUUID(),
      kuerzelNorm,
      angelegtAm: alt?.angelegtAm ?? jetzt,
      geaendertAm: jetzt,
    }
    await db.patienten.put(patient)
    return patient.id
  })
}

export async function loeschePatient(id: string): Promise<void> {
  await db.patienten.delete(id)
}

/** Bittet den Browser, die Daten nicht automatisch zu löschen, wenn der Speicher knapp wird. */
export async function dauerhaftenSpeicherAnfragen(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist()
    }
  } catch {
    // nicht jeder Browser unterstützt das – kein Problem
  }
}
