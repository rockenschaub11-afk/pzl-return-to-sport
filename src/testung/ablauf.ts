// Welche Tests gehören zu einer Testung, und wie weit ist sie?

import type { Testung } from '../db'
import { KATALOG } from '../katalog'
import type { PhaseId, TestDef } from '../katalog/typen'
import type { Geschlecht } from '../patienten/stammdaten'
import { bewerteTest, type TestErgebnis } from '../rechnen/bewertung'
import { berechne, hatEingabe, parseZahl, type Berechnung } from './erfassung'

/** Etappe 4: Endtestung wird immer mit den Schwellen „> 9 Mo“ bewertet (Phasen folgen in Etappe 7). */
export const ENDTESTUNG_PHASE: PhaseId = 'rtc'

export const ENDTESTUNG_TESTS: readonly TestDef[] = KATALOG.tests.filter((t) => t.inEndtestung)

/** Tests, die in dieser Testung angezeigt werden: alle Pflicht-Tests plus hinzugefügte optionale. */
export function sichtbareTests(testung: Pick<Testung, 'optionaleTests'>): TestDef[] {
  return ENDTESTUNG_TESTS.filter((t) => !t.optional || testung.optionaleTests.includes(t.id))
}

export function fortschritt(testung: Testung): { erfasst: number; gesamt: number } {
  const tests = sichtbareTests(testung)
  return { erfasst: tests.filter((t) => hatEingabe(testung.eingaben[t.id])).length, gesamt: tests.length }
}

export interface TestAuswertung {
  berechnung: Berechnung
  ergebnis: TestErgebnis
}

/** Berechnung und Bewertung aller Endtestungs-Tests einer Testung. */
export function werteAus(testung: Pick<Testung, 'eingaben' | 'koerpergewichtKg'>, geschlecht?: Geschlecht | ''): Map<string, TestAuswertung> {
  const kg = parseZahl(testung.koerpergewichtKg)
  const m = new Map<string, TestAuswertung>()
  for (const t of ENDTESTUNG_TESTS) {
    const berechnung = berechne(t, testung.eingaben[t.id] ?? {}, { koerpergewichtKg: kg })
    m.set(t.id, { berechnung, ergebnis: bewerteTest(t, ENDTESTUNG_PHASE, berechnung.werte, { geschlecht }) })
  }
  return m
}

/** Kurztext für Listen: „in Arbeit“ bzw. „abgeschlossen · Kriterien erfüllt“. */
export function statusText(testung: Testung): string {
  if (testung.status !== 'abgeschlossen') return 'in Arbeit'
  const e = testung.entscheidung
  const vorschlagErfuellt = e?.vorschlagBeiAbschluss === 'erfuellt'
  const erfuellt = e?.art === 'bestaetigt' ? vorschlagErfuellt : e?.art === 'ueberstimmt_erfuellt'
  return `abgeschlossen · ${erfuellt ? 'Kriterien erfüllt' : 'Kriterien nicht erfüllt'}`
}
