// Normdaten als graue Zusatzinfo (docs/ENTSCHEIDUNGEN.md 9, F24; Etappe-7-Frage 7):
// nur bei genau passender Gruppe (Geschlecht + Altersband) und nahem Zeitpunkt – lieber nichts als etwas Falsches.

import normDatei from '../../config/normdaten.json'
import type { Patient } from '../patienten/stammdaten'

interface NormWert {
  test: string
  name: string
  seite?: 'betroffen' | 'gesund'
  /** Vergleichsgruppe ohne Verletzung („Uninjured“) */
  vergleich?: boolean
  mittel: number
  von?: number
  bis?: number
  einheit: string
}

interface NormGruppe {
  monate: number
  geschlecht: 'weiblich' | 'maennlich'
  alter: string
  werte: NormWert[]
}

interface NormKatalog {
  quelle: string
  toleranzMonate: number
  altersbaender: { id: string; name: string; von: number; bis: number }[]
  gruppen: NormGruppe[]
  hinweise: Record<string, string>
}

export const NORMDATEN = normDatei as unknown as NormKatalog

export interface NormAnzeige {
  /** z. B. „Typisch nach VKB-OP (6 Mo, männlich 20–30)“ – leer, wenn keine passende Gruppe */
  kopf: string
  zeilen: string[]
  hinweis?: string
  /** Grund, warum nichts angezeigt wird */
  keine?: string
}

const zahl = (v: number) => v.toLocaleString('de-AT', { maximumFractionDigits: 2 })

function zeile(w: NormWert): string {
  const einheit = w.einheit === '%' ? ' %' : w.einheit ? ` ${w.einheit}` : ''
  const seite = w.seite ? ` ${w.seite}` : ''
  const bereich = w.von !== undefined && w.bis !== undefined ? ` (±1 SD ${zahl(w.von)}–${zahl(w.bis)})` : ''
  const wer = w.vergleich ? 'Vergleich ohne Verletzung – ' : ''
  return `${wer}${w.name}${seite}: ${zahl(w.mittel)}${einheit}${bereich}`
}

/** Altersband am Tag der Testung (nur über das Geburtsjahr – ungefähr). */
export function altersband(geburtsjahr: string, testDatum: string): string | null {
  const jahr = Number(geburtsjahr)
  if (!Number.isInteger(jahr) || !testDatum) return null
  const alter = Number(testDatum.slice(0, 4)) - jahr
  return NORMDATEN.altersbaender.find((b) => alter >= b.von && alter <= b.bis)?.id ?? null
}

/** Nächster Normzeitpunkt (6 / 9 / 12 Monate) innerhalb der Toleranz. */
export function normzeitpunkt(monate: number | null): number | null {
  if (monate === null) return null
  const zeitpunkte = [...new Set(NORMDATEN.gruppen.map((g) => g.monate))]
  const naechster = zeitpunkte.reduce((a, b) => (Math.abs(b - monate) < Math.abs(a - monate) ? b : a))
  return Math.abs(naechster - monate) <= NORMDATEN.toleranzMonate ? naechster : null
}

/** Boxhöhe des SL-Drop-Jumps im Normdaten-Report (VALD) */
const NORMDATEN_BOX_CM = 15

/** null = für diesen Test gibt es überhaupt keine Normdaten (dann zeigt die App nichts). */
export function normdatenFuer(
  testId: string,
  patient: Pick<Patient, 'geschlecht' | 'geburtsjahr'>,
  testDatum: string,
  monate: number | null,
  /** tatsächliche Boxhöhe (SL-Drop-Jump) – mit 15 cm wie im Report entfällt der Hinweis */
  boxCm: number | null = null,
): NormAnzeige | null {
  if (!NORMDATEN.gruppen.some((g) => g.werte.some((w) => w.test === testId))) return null
  const hinweis = testId === 'sl_dj' && boxCm === NORMDATEN_BOX_CM ? undefined : NORMDATEN.hinweise[testId]
  const keine = (grund: string): NormAnzeige => ({ kopf: '', zeilen: [], hinweis, keine: `Keine passenden Normdaten – ${grund}.` })

  if (patient.geschlecht !== 'weiblich' && patient.geschlecht !== 'maennlich') return keine('Geschlecht (w/m) in den Stammdaten fehlt')
  const band = altersband(patient.geburtsjahr, testDatum)
  if (!patient.geburtsjahr) return keine('Geburtsjahr in den Stammdaten fehlt')
  if (!band) return keine('kein Altersband im Report (nur 16–20 und 20–30)')
  const zeitpunkt = normzeitpunkt(monate)
  if (zeitpunkt === null) return keine('Report nur für 6, 9 und 12 Monate nach OP')

  const gruppe = NORMDATEN.gruppen.find((g) => g.monate === zeitpunkt && g.geschlecht === patient.geschlecht && g.alter === band)
  const werte = gruppe?.werte.filter((w) => w.test === testId) ?? []
  if (werte.length === 0) return keine('der Report enthält für diese Gruppe keine Werte zu diesem Test')

  const bandName = NORMDATEN.altersbaender.find((b) => b.id === band)?.name
  return {
    kopf: `Typisch nach VKB-OP (${zeitpunkt} Mo, ${patient.geschlecht === 'weiblich' ? 'weiblich' : 'männlich'} ${bandName})`,
    zeilen: werte.map(zeile),
    hinweis,
  }
}
