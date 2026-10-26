import Dexie, { type EntityTable } from 'dexie'
import { normalisiereKuerzel, type Patient, type Stammdaten } from './patienten/stammdaten'
import type { PhaseId } from './katalog/typen'
import type { TestEingabe } from './testung/erfassung'

export interface Testung {
  id: string
  patientId: string
  /** Endtestung (8–9 Mo, > 9 Mo, mit RTS-Vorschlag) oder Verlaufstest (Früh/Mitte/Spät) */
  art: 'endtestung' | 'verlauf'
  /** Phase beim Anlegen; bis zum Abschluss aus dem Datum neu bestimmt, danach fix. Fehlt bei Testungen vor Etappe 7 (= „> 9 Mo“). */
  phase?: PhaseId
  /** Phase übersteuert – zählt nur mit Begründung */
  phaseUebersteuert?: { phase: PhaseId | ''; begruendung: string }
  /** in_arbeit bis zum Abschluss; abgeschlossen = schreibgeschützt */
  status: 'in_arbeit' | 'abgeschlossen'
  datum: string // JJJJ-MM-TT
  koerpergewichtKg: string
  tegnerAktuell: string
  /** Eingaben je Test-id, genau wie getippt */
  eingaben: Record<string, TestEingabe>
  /** optionale Tests, die hinzugefügt wurden */
  optionaleTests: string[]
  /** „klinisch anders beurteilt“ je Test (F33) – zählt nur mit Begründung */
  klinischAnders?: Record<string, KlinischAnders>
  /** Entscheidung der Therapeut:in (F10) – Entwurf, bis die Testung abgeschlossen wird */
  entscheidung?: Entscheidung
  abgeschlossenAm?: string
  angelegtAm: string
  geaendertAm: string
}

export interface KlinischAnders {
  urteil: 'erfuellt' | 'nicht_erfuellt' | ''
  begruendung: string
}

export interface Entscheidung {
  art: 'bestaetigt' | 'ueberstimmt_erfuellt' | 'ueberstimmt_nicht_erfuellt' | ''
  begruendung: string
  therapeut: string
  /** Vorschlag der App zum Zeitpunkt des Abschlusses */
  vorschlagBeiAbschluss?: 'erfuellt' | 'nicht_erfuellt'
}

/** Einstellungen dieses Laptops, z. B. die persönliche Meloq-Auswahl (wird in Etappe 10 mitgesichert). */
export interface Einstellung {
  id: string
  wert: unknown
}

// Alle Daten liegen nur in der IndexedDB dieses Browsers – nichts verlässt den Laptop.
export const db = new Dexie('pzl-return-to-sport') as Dexie & {
  patienten: EntityTable<Patient, 'id'>
  testungen: EntityTable<Testung, 'id'>
  einstellungen: EntityTable<Einstellung, 'id'>
}

db.version(1).stores({
  // &kuerzelNorm = eindeutig → doppelte Kürzel sind auch in der Datenbank ausgeschlossen
  patienten: 'id, &kuerzelNorm, geaendertAm',
})

db.version(2).stores({
  patienten: 'id, &kuerzelNorm, geaendertAm',
  testungen: 'id, patientId, geaendertAm',
})

db.version(3).stores({
  patienten: 'id, &kuerzelNorm, geaendertAm',
  testungen: 'id, patientId, geaendertAm',
  einstellungen: 'id',
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

/** Löscht das Kürzel samt allen Testungen dazu. */
export async function loeschePatient(id: string): Promise<void> {
  await db.transaction('rw', db.patienten, db.testungen, async () => {
    await db.testungen.where('patientId').equals(id).delete()
    await db.patienten.delete(id)
  })
}

/** Neue Testung – Phase und Art ergeben sich aus OP-Datum und Datum der Testung. */
export async function neueTestung(patientId: string, datum: string, phase: PhaseId): Promise<string> {
  const jetzt = new Date().toISOString()
  const testung: Testung = {
    id: crypto.randomUUID(),
    patientId,
    art: phase === 'rtt' || phase === 'rtc' ? 'endtestung' : 'verlauf',
    phase,
    status: 'in_arbeit',
    datum,
    koerpergewichtKg: '',
    tegnerAktuell: '',
    eingaben: {},
    optionaleTests: [],
    angelegtAm: jetzt,
    geaendertAm: jetzt,
  }
  await db.testungen.add(testung)
  return testung.id
}

export async function speichereTestung(testung: Testung): Promise<void> {
  await db.testungen.put({ ...testung, geaendertAm: new Date().toISOString() })
}

export async function loescheTestung(id: string): Promise<void> {
  await db.testungen.delete(id)
}

export async function speichereEinstellung(id: string, wert: unknown): Promise<void> {
  await db.einstellungen.put({ id, wert })
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
