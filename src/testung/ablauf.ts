// Welche Tests gehören zu einer Testung, und wie weit ist sie?

import type { Testung } from '../db'
import { KATALOG } from '../katalog'
import type { PhaseId, TestDef } from '../katalog/typen'
import { hatEingabe } from './erfassung'

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
