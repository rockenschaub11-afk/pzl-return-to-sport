// Leistungsprofil einer Testung (Visualisierung Stufe 2, Konzept E): Abstand jedes Absolut-Kriteriums zu seiner Phasenschwelle –
// in der Einheit des Tests, ohne Umrechnung in Prozent und ohne Gesamtwert (Kraft und Sprung bleiben nicht vergleichbar).
// Wert, Schwelle und Ampel kommen unverändert aus der Bewertung (gerundet wie angezeigt).

import type { Testung } from '../db'
import { BLOCK_NAMEN, STATUS_NAMEN, type Block, type Vergleich } from '../katalog/typen'
import type { Patient } from '../patienten/stammdaten'
import type { Ampel } from '../rechnen/bewertung'
import { gerundet } from '../rechnen/versuche'
import { ERFASSBARE_TESTS, phasenStand, werteAus } from './ablauf'

export interface ProfilZeile {
  id: string
  test: string
  kriterium: string
  einheit: string
  nachkomma: number
  wert: number
  schwelle: number
  vergleich: Vergleich
  /** Wert − Schwelle, gerundet wie der Wert */
  abstand: number
  /** erfüllt die Richtung des Ziels (über bzw. unter der Schwelle) */
  erfuellt: boolean
  ampel: Ampel | null
  status: string
  /** Schwelle aus einer früheren Phase übernommen */
  uebernommen: boolean
}

export function leistungsprofil(patient: Pick<Patient, 'opDatum' | 'geschlecht'>, testung: Testung): { block: Block; name: string; zeilen: ProfilZeile[] }[] {
  const phase = phasenStand(testung, patient.opDatum).phase
  const aus = werteAus(testung, phase, patient.geschlecht)
  const zeilen = ERFASSBARE_TESTS.flatMap((t) =>
    (aus.get(t.id)?.ergebnis.kriterien ?? []).flatMap((e): (ProfilZeile & { block: Block })[] => {
      const k = e.kriterium
      if ((k.art !== 'absolut' && k.art !== 'asymmetrie') || typeof e.wert !== 'number' || !e.schwelle || !k.vergleich) return []
      if (e.zustand !== 'bewertet' && e.zustand !== 'info') return []
      const nachkomma = k.nachkomma ?? 1
      const abstand = gerundet(e.wert - e.schwelle.wert, nachkomma)
      return [
        {
          block: t.block,
          id: `${t.id}:${k.id}`,
          test: t.name,
          kriterium: k.bezeichnung,
          einheit: k.einheit ?? '',
          nachkomma,
          wert: e.wert,
          schwelle: e.schwelle.wert,
          vergleich: k.vergleich,
          abstand,
          erfuellt: k.vergleich === '>' ? e.wert > e.schwelle.wert : k.vergleich === '>=' ? e.wert >= e.schwelle.wert : k.vergleich === '<' ? e.wert < e.schwelle.wert : e.wert <= e.schwelle.wert,
          ampel: e.ampel ?? null,
          status: STATUS_NAMEN[k.status],
          uebernommen: e.schwelle.uebernommen,
        },
      ]
    }),
  )
  return [...new Set(zeilen.map((z) => z.block))].map((block) => ({ block, name: BLOCK_NAMEN[block], zeilen: zeilen.filter((z) => z.block === block) }))
}
