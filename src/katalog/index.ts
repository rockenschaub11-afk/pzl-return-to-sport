// Lädt den Testkatalog aus config/ und prüft ihn einmal beim Start.

import phasenDatei from '../../config/phasen.json'
import protokolleDatei from '../../config/protokolle.json'
import regelnDatei from '../../config/regeln.json'
import testsDatei from '../../config/tests.json'
import { pruefeKatalog } from './pruefen'
import type { Katalog, Phase, PhaseId, Protokoll, Regeln, TestDef } from './typen'

export const KATALOG: Katalog = {
  phasen: phasenDatei.phasen as unknown as Phase[],
  regeln: regelnDatei as unknown as Regeln,
  protokolle: protokolleDatei.protokolle as unknown as Protokoll[],
  tests: testsDatei.tests as unknown as TestDef[],
}

/** Leer, wenn alles passt – sonst eine Meldung je Problem. */
export const KATALOG_FEHLER: readonly string[] = pruefeKatalog(KATALOG)

export const testNach = (id: string) => KATALOG.tests.find((t) => t.id === id)
export const protokollNach = (id: string) => KATALOG.protokolle.find((p) => p.id === id)
export const phaseNach = (id: PhaseId) => KATALOG.phasen.find((p) => p.id === id)!
