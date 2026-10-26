// Persönlicher Standard der Meloq-Zusatzmetriken – einer je Laptop (Etappe-5-Frage 6).

import { useLiveQuery } from 'dexie-react-hooks'
import { db, speichereEinstellung } from '../db'
import { MELOQ, MELOQ_TESTS, zusatzFuer, type MeloqTest } from '../katalog/meloq'

export type MeloqAuswahl = Record<MeloqTest, string[]>

const SCHLUESSEL = 'meloqAuswahl'

/** Gespeicherte Auswahl, ergänzt um den Standard für Tests ohne Eintrag; unbekannte Metriken fallen weg. */
export function auswahlBereinigen(gespeichert: unknown): MeloqAuswahl {
  const roh = (gespeichert && typeof gespeichert === 'object' ? gespeichert : {}) as Partial<Record<MeloqTest, unknown>>
  const ergebnis = {} as MeloqAuswahl
  for (const t of MELOQ_TESTS) {
    const erlaubt = new Set(zusatzFuer(t).map((m) => m.id))
    const liste = Array.isArray(roh[t]) ? (roh[t] as unknown[]).filter((id): id is string => typeof id === 'string' && erlaubt.has(id)) : null
    ergebnis[t] = liste ?? [...MELOQ.standard[t]]
  }
  return ergebnis
}

/** undefined, solange noch geladen wird */
export function useMeloqAuswahl(): MeloqAuswahl | undefined {
  return useLiveQuery(async () => auswahlBereinigen((await db.einstellungen.get(SCHLUESSEL))?.wert), [])
}

export async function metrikUmschalten(auswahl: MeloqAuswahl, test: MeloqTest, metrik: string): Promise<void> {
  const aktuell = auswahl[test]
  const neu = aktuell.includes(metrik) ? aktuell.filter((m) => m !== metrik) : [...aktuell, metrik]
  await speichereEinstellung(SCHLUESSEL, { ...auswahl, [test]: neu })
}
