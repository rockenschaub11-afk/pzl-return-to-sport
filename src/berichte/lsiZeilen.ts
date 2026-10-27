// LSI-Übersicht im Arztbericht (Bericht-Redesign, Muster freigegeben 27.10.2026):
// je gemessenem Test mit LSI-Kriterium eine Zeile – Wert, Ampel und vorige Testung kommen unverändert aus dem Pat.-Bericht,
// Pflicht/wünschenswert aus dem Arztbericht. Keine neue Rechnung.

import { STATUS_NAMEN } from '../katalog/typen'
import type { Ampel } from '../rechnen/bewertung'
import type { ArztBericht, PatBericht } from './bericht'

export interface LsiZeile {
  id: string
  name: string
  lsi: number
  vorige: number | null
  ampel: Ampel | null
  wuenschenswert: boolean
}

export function lsiUebersicht(arzt: ArztBericht, pat: PatBericht): LsiZeile[] {
  const patNach = new Map(pat.zeilen.map((z) => [z.id, z]))
  return arzt.bloecke.flatMap((b) =>
    b.tests.flatMap((t) => {
      const z = patNach.get(t.test.id)
      const k = t.kriterien.find((x) => x.bezeichnung.startsWith('LSI') && x.bezeichnung !== 'LSI zur Vorverletzung')
      if (!t.gemessen || !z || z.lsi === null || !k) return []
      const zusatz = k.bezeichnung.replace(/^LSI\s*/, '')
      return [{ id: t.test.id, name: zusatz ? `${t.test.name} – ${zusatz}` : t.test.name, lsi: z.lsi, vorige: z.vorige, ampel: z.lsiAmpel, wuenschenswert: k.status === STATUS_NAMEN.wuenschenswert }]
    }),
  )
}
