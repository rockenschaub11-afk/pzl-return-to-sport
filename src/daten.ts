// Lesen aus der Datenbank an einer Stelle (Audit L1): Seiten fragen über diese Hooks statt direkt über db.
// Alle Hooks sind live (Dexie) – ändert sich die Datenbank, rendern die Seiten neu.
// Rückgabe: undefined = lädt noch; null = gibt es nicht. Schreiben bleibt in db.ts (speichereTestung, speichereEinstellung …).

import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Testung } from './db'
import type { Patient } from './patienten/stammdaten'

/** Alle Kürzel – ungeordnet, nach Kürzel oder zuletzt geändert zuerst. */
export function usePatienten(reihenfolge: 'egal' | 'kuerzel' | 'zuletzt' = 'egal'): Patient[] | undefined {
  return useLiveQuery(
    () => (reihenfolge === 'kuerzel' ? db.patienten.orderBy('kuerzelNorm').toArray() : reihenfolge === 'zuletzt' ? db.patienten.orderBy('geaendertAm').reverse().toArray() : db.patienten.toArray()),
    [reihenfolge],
  )
}

/** Ein Kürzel nach id; ohne id null. */
export function usePatient(id: string | undefined): Patient | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.patienten.get(id)) ?? null) : null), [id])
}

/** Ein Kürzel nach normalisiertem Kürzel (z. B. Beispiel-Pat.). */
export function usePatientMitKuerzel(kuerzelNorm: string): Patient | null | undefined {
  return useLiveQuery(async () => (await db.patienten.where('kuerzelNorm').equals(kuerzelNorm).first()) ?? null, [kuerzelNorm])
}

/** Alle Testungen – ungeordnet oder zuletzt geändert zuerst. */
export function useTestungen(reihenfolge: 'egal' | 'zuletzt' = 'egal'): Testung[] | undefined {
  return useLiveQuery(() => (reihenfolge === 'zuletzt' ? db.testungen.orderBy('geaendertAm').reverse().toArray() : db.testungen.toArray()), [reihenfolge])
}

/** Eine Testung nach id; ohne id null. */
export function useTestung(id: string | undefined): Testung | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.testungen.get(id)) ?? null) : null), [id])
}

/** Testungen eines Kürzels – ungeordnet oder nach Datum, neueste zuerst. */
export function useTestungenVon(patientId: string | undefined, reihenfolge: 'egal' | 'neueste' = 'egal'): Testung[] | undefined {
  return useLiveQuery(async () => {
    if (!patientId) return []
    const t = db.testungen.where('patientId').equals(patientId)
    return reihenfolge === 'neueste' ? t.reverse().sortBy('datum') : t.toArray()
  }, [patientId, reihenfolge])
}

/** Einstellung dieses Laptops; fehlt sie, gilt der Standard. */
export function useEinstellung<T>(schluessel: string, standard: T): T | undefined {
  const gelesen = useLiveQuery(async () => ({ wert: (await db.einstellungen.get(schluessel))?.wert as T | undefined }), [schluessel])
  return gelesen === undefined ? undefined : (gelesen.wert ?? standard)
}
