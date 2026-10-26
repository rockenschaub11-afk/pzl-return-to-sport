// Welche Tests gehören zu einer Testung, in welcher Phase, und wie weit ist sie?
// (docs/ENTSCHEIDUNGEN.md 7; Etappe-7-Fragen 1–5, 8)

import type { Testung } from '../db'
import { KATALOG } from '../katalog'
import type { PhaseId, TestDef } from '../katalog/typen'
import { monateSeit, type Geschlecht } from '../patienten/stammdaten'
import { bewerteTest, type TestErgebnis } from '../rechnen/bewertung'
import { berechne, ERFASSUNG, hatEingabe, parseZahl, type Berechnung } from './erfassung'

/** Phasen, in denen eine Endtestung (mit RTS-Vorschlag) stattfindet – davor Verlaufstests. */
export const ENDTESTUNG_PHASEN: readonly PhaseId[] = ['rtt', 'rtc']

/** Alle Tests, für die es eine Eingabemaske gibt (Katalog-Reihenfolge). */
export const ERFASSBARE_TESTS: readonly TestDef[] = KATALOG.tests.filter((t) => ERFASSUNG[t.id])

export const artFuer = (phase: PhaseId): Testung['art'] => (ENDTESTUNG_PHASEN.includes(phase) ? 'endtestung' : 'verlauf')

/** Phase aus vollen Monaten seit OP (Grenzen aus config/phasen.json). */
export function phaseAusMonaten(monate: number): PhaseId {
  const p = KATALOG.phasen.find((x) => monate >= x.vonMonat && (x.bisMonat === null || monate < x.bisMonat))
  return p?.id ?? 'frueh'
}

const alsDatum = (iso: string) => new Date(`${iso}T12:00:00`)
const heuteIso = () => new Date().toISOString().slice(0, 10)

export function monateBisTestung(opDatum: string, testDatum: string): number | null {
  return monateSeit(opDatum, alsDatum(testDatum || heuteIso()))
}

export function wochenBisTestung(opDatum: string, testDatum: string): number | null {
  if (!opDatum) return null
  const tage = (alsDatum(testDatum || heuteIso()).getTime() - alsDatum(opDatum).getTime()) / 86_400_000
  return Math.max(0, Math.floor(tage / 7))
}

export interface PhasenStand {
  phase: PhaseId
  /** Phase aus dem OP-Datum (bzw. die gespeicherte, wenn fix) */
  automatisch: PhaseId
  uebersteuert: boolean
  /** fix = abgeschlossen oder ältere Testung ohne gespeicherte Phase */
  fix: boolean
  art: Testung['art']
}

/**
 * Phase einer Testung. In Arbeit: aus OP-Datum und Datum der Testung (übersteuerbar mit Begründung);
 * abgeschlossen: die beim Abschluss gespeicherte Phase. Ältere Testungen ohne gespeicherte Phase bleiben „> 9 Mo“.
 */
export function phasenStand(t: Pick<Testung, 'phase' | 'phaseUebersteuert' | 'datum' | 'status'>, opDatum: string): PhasenStand {
  const abgeschlossen = t.status === 'abgeschlossen'
  const fix = t.phase === undefined || abgeschlossen
  const u = t.phaseUebersteuert
  const mitBegruendung = !!u && u.phase !== '' && u.begruendung.trim() !== ''
  if (abgeschlossen) {
    const phase = t.phase ?? 'rtc'
    return { phase, automatisch: phase, uebersteuert: mitBegruendung, fix, art: artFuer(phase) }
  }
  const automatisch: PhaseId = t.phase === undefined ? 'rtc' : phaseAusMonaten(monateBisTestung(opDatum, t.datum) ?? 0)
  const phase = mitBegruendung ? (u!.phase as PhaseId) : automatisch
  return { phase, automatisch, uebersteuert: mitBegruendung, fix, art: artFuer(phase) }
}

/** Testset einer Phase (ENTSCHEIDUNGEN 7.2): alle erfassbaren Tests, die in dieser Phase vorgesehen sind. */
export const testset = (phase: PhaseId) => ERFASSBARE_TESTS.filter((t) => t.phasen.includes(phase))

/** Angezeigt: Testset ohne nicht gewählte optionale Tests, plus hinzugefügte Tests. */
export function sichtbareTests(testung: Pick<Testung, 'optionaleTests'>, phase: PhaseId): TestDef[] {
  const set = testset(phase)
  return ERFASSBARE_TESTS.filter((t) => (set.includes(t) && !t.optional) || testung.optionaleTests.includes(t.id))
}

/** Was sich hinzufügen lässt: optionale Tests der Phase und alle übrigen Tests des Katalogs. */
export function hinzufuegbar(testung: Pick<Testung, 'optionaleTests'>, phase: PhaseId): { optional: TestDef[]; weitere: TestDef[] } {
  const sichtbar = sichtbareTests(testung, phase)
  const set = testset(phase)
  const offen = ERFASSBARE_TESTS.filter((t) => !sichtbar.includes(t))
  return { optional: offen.filter((t) => set.includes(t)), weitere: offen.filter((t) => !set.includes(t)) }
}

export function fortschritt(testung: Testung, phase: PhaseId): { erfasst: number; gesamt: number } {
  const tests = sichtbareTests(testung, phase)
  return { erfasst: tests.filter((t) => hatEingabe(testung.eingaben[t.id])).length, gesamt: tests.length }
}

export interface TestAuswertung {
  berechnung: Berechnung
  ergebnis: TestErgebnis
}

/** Berechnung und Bewertung aller erfassbaren Tests einer Testung mit den Schwellen ihrer Phase. */
export function werteAus(
  testung: Pick<Testung, 'eingaben' | 'koerpergewichtKg'>,
  phase: PhaseId,
  geschlecht?: Geschlecht | '',
): Map<string, TestAuswertung> {
  const kg = parseZahl(testung.koerpergewichtKg)
  const m = new Map<string, TestAuswertung>()
  for (const t of ERFASSBARE_TESTS) {
    const berechnung = berechne(t, testung.eingaben[t.id] ?? {}, { koerpergewichtKg: kg })
    m.set(t.id, { berechnung, ergebnis: bewerteTest(t, phase, berechnung.werte, { geschlecht }) })
  }
  return m
}

export const ART_TEXT: Record<Testung['art'], string> = { endtestung: 'Endtestung', verlauf: 'Verlaufstest' }

/** Kurztext für Listen: „in Arbeit“ bzw. „abgeschlossen · Kriterien erfüllt“. */
export function statusText(testung: Testung): string {
  if (testung.status !== 'abgeschlossen') return 'in Arbeit'
  if (testung.art === 'verlauf') return 'abgeschlossen'
  const e = testung.entscheidung
  const vorschlagErfuellt = e?.vorschlagBeiAbschluss === 'erfuellt'
  const erfuellt = e?.art === 'bestaetigt' ? vorschlagErfuellt : e?.art === 'ueberstimmt_erfuellt'
  return `abgeschlossen · ${erfuellt ? 'Kriterien erfüllt' : 'Kriterien nicht erfüllt'}`
}
