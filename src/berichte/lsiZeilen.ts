// LSI-Übersicht im Arztbericht (Bericht-Redesign, Muster freigegeben 27.10.2026):
// je gemessenem Test mit LSI-Kriterium eine Zeile – Wert, Ampel und vorige Testung kommen unverändert aus dem Pat.-Bericht,
// Pflicht/wünschenswert aus dem Arztbericht. Keine neue Rechnung.
// Visualisierung Stufe 1: dazu die Bestwerte je Seite (wie in der Ergebnistabelle) und die Spanne aus den Einzelversuchen.

import { STATUS_NAMEN } from '../katalog/typen'
import type { Ampel } from '../rechnen/bewertung'
import { lsiSpanne } from '../rechnen/spanne'
import type { ArztBericht, PatBericht } from './bericht'

export interface LsiZeile {
  id: string
  name: string
  lsi: number
  vorige: number | null
  ampel: Ampel | null
  wuenschenswert: boolean
  /** Bestwerte je Seite mit Einheit, z. B. „8,3 N/kg“ – gleiche Zahlen wie in der Ergebnistabelle */
  gesund?: string
  betroffen?: string
  /** LSI aus allen Kombinationen der Einzelversuche (nur ab 2 Versuchen auf einer Seite) */
  spanne?: [number, number] | null
}

export function lsiUebersicht(arzt: ArztBericht, pat: PatBericht): LsiZeile[] {
  const patNach = new Map(pat.zeilen.map((z) => [z.id, z]))
  const rohNach = new Map(arzt.rohdaten.map((r) => [r.id, r]))
  return arzt.bloecke.flatMap((b) =>
    b.tests.flatMap((t) => {
      const z = patNach.get(t.test.id)
      const k = t.kriterien.find((x) => x.bezeichnung.startsWith('LSI') && x.bezeichnung !== 'LSI zur Vorverletzung')
      if (!t.gemessen || !z || z.lsi === null || !k) return []
      const zusatz = k.bezeichnung.replace(/^LSI\s*/, '')
      // Lage (sitzend, Bauchlage) steht in der Testkarte – hier zählt die kurze Zeile
      const name = t.test.name.replace(/, (sitzend|Bauchlage)\)/, ')')
      const roh = rohNach.get(t.test.id)
      const seite = (s: 'gesund' | 'betroffen') => roh?.zeilen.find((r) => r.seite === s)?.werte ?? []
      return [
        {
          id: t.test.id,
          name: zusatz ? `${name} – ${zusatz}` : name,
          lsi: z.lsi,
          vorige: z.vorige,
          ampel: z.lsiAmpel,
          wuenschenswert: k.status === STATUS_NAMEN.wuenschenswert,
          gesund: t.seitenSpalten?.gesund,
          betroffen: t.seitenSpalten?.betroffen,
          spanne: roh ? lsiSpanne(seite('gesund'), seite('betroffen'), !!t.test.zeitTest) : null,
        },
      ]
    }),
  )
}
