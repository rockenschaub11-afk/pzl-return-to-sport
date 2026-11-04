// Testabdeckung je Kürzel (Visualisierung Stufe 2, Konzept A): welche Tests bei welcher Testung gemessen wurden.
// Status je Zelle = Status im Kopf der Testkarte (kartenStatus) – keine eigene Bewertung.

import type { Testung } from '../db'
import { phaseNach } from '../katalog'
import { BLOCK_NAMEN, type Block } from '../katalog/typen'
import type { Patient } from '../patienten/stammdaten'
import type { Ampel } from '../rechnen/bewertung'
import { ERFASSBARE_TESTS, phasenStand, sichtbareTests, werteAus } from './ablauf'
import { hatEingabe } from './erfassung'
import { kartenStatus } from './kartenStatus'
import { monateGenau } from './verlauf'
import { MOTOR } from '../katalog/motorcontrol'
import { scoreKurz } from './motorik'

export type AbdeckungZelle =
  /** gemessen; ampel null = ohne Pflicht-Bewertung (z. B. nur Info) */
  | { zustand: 'gemessen'; ampel: Ampel | null; text: string }
  /** im Testset dieser Testung, aber ohne Wert */
  | { zustand: 'fehlt' }
  /** gehört nicht zu dieser Testung */
  | { zustand: 'nicht_im_set' }
  /** Motor Control: Score als Text, ohne Ampel (Philipp 04.11.2026) */
  | { zustand: 'motor'; text: string }

export interface AbdeckungSpalte {
  testungId: string
  datum: string
  monate: number | null
  phase: string
}

export interface Abdeckung {
  spalten: AbdeckungSpalte[]
  bloecke: { block: Block | 'motor'; name: string; zeilen: { id: string; name: string; zellen: AbdeckungZelle[] }[] }[]
}

/** höchstens so viele Testungen – die erste (Ausgangswert) bleibt, dazu die letzten (wie in der Verlaufstabelle des Arztberichts) */
export const MAX_SPALTEN = 8

export function testAbdeckung(patient: Pick<Patient, 'opDatum' | 'geschlecht'>, testungen: readonly Testung[]): Abdeckung {
  const sortiert = [...testungen].sort((a, b) => a.datum.localeCompare(b.datum))
  const auswahl = sortiert.length <= MAX_SPALTEN ? sortiert : [sortiert[0], ...sortiert.slice(-(MAX_SPALTEN - 1))]
  const je = auswahl.map((t) => {
    const phase = phasenStand(t, patient.opDatum).phase
    return { t, phase, set: new Set(sichtbareTests(t, phase).map((x) => x.id)), aus: werteAus(t, phase, patient.geschlecht) }
  })

  const zeilen = ERFASSBARE_TESTS.map((test) => ({
    test,
    zellen: je.map(({ t, set, aus }): AbdeckungZelle => {
      if (hatEingabe(t.eingaben[test.id])) {
        const s = kartenStatus(aus.get(test.id)!.ergebnis, true)
        return { zustand: 'gemessen', ampel: s.ampel, text: s.text }
      }
      return set.has(test.id) ? { zustand: 'fehlt' } : { zustand: 'nicht_im_set' }
    }),
  })).filter((z) => z.zellen.some((c) => c.zustand !== 'nicht_im_set'))

  const bloecke: Abdeckung['bloecke'] = [...new Set(zeilen.map((z) => z.test.block))].map((block) => ({
    block,
    name: BLOCK_NAMEN[block],
    zeilen: zeilen.filter((z) => z.test.block === block).map((z) => ({ id: z.test.id, name: z.test.name, zellen: z.zellen })),
  }))

  // Motor Control nach Klinik – nur Tests, die in einer der Testungen bewertet wurden; Score grau als Text
  const motor = MOTOR.tests
    .map((def) => ({
      id: def.id,
      name: def.name,
      zellen: je.map(({ t }): AbdeckungZelle => {
        const k = scoreKurz(def, t.motorControl?.[def.id])
        return k ? { zustand: 'motor', text: k } : { zustand: 'nicht_im_set' }
      }),
    }))
    .filter((z) => z.zellen.some((c) => c.zustand === 'motor'))
  if (motor.length > 0) bloecke.splice(bloecke.findIndex((b) => b.block === 'klinik') + 1, 0, { block: 'motor', name: 'Motor Control', zeilen: motor })

  return {
    spalten: je.map(({ t, phase }) => ({ testungId: t.id, datum: t.datum, monate: monateGenau(patient.opDatum, t.datum), phase: phaseNach(phase).name })),
    bloecke,
  }
}
