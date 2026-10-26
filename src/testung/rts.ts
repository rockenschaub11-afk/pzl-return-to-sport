// RTS-Vorschlag (docs/ENTSCHEIDUNGEN.md 3.1, F25; Etappe-6-Fragen).
// „Kriterien erfüllt“ nur, wenn alle Pflicht-Kriterien grün sind UND die Mindestzeit seit OP erreicht ist.
// Formulierung bewusst nie „Freigabe“ (F36).

import type { Testung } from '../db'
import { KATALOG } from '../katalog'
import type { Kriterium, TestDef } from '../katalog/typen'
import { monateSeit, type Patient } from '../patienten/stammdaten'
import type { KriteriumErgebnis } from '../rechnen/bewertung'
import { sichtbareTests, type TestAuswertung } from './ablauf'

export type PflichtStatus = 'erfuellt' | 'nicht_erfuellt' | 'fehlt'

export interface PflichtTest {
  test: TestDef
  /** Status nach Ampel – vor einer klinisch anderen Beurteilung */
  ampelStatus: PflichtStatus
  /** Status, der zählt (mit „klinisch anders beurteilt“) */
  status: PflichtStatus
  klinischAnders?: { urteil: 'erfuellt' | 'nicht_erfuellt'; begruendung: string }
  /** was nicht passt, z. B. „LSI 85,0 % – Ziel ≥ 90 %“ */
  gruende: string[]
}

export interface RtsVorschlag {
  erfuellt: boolean
  monate: number | null
  zeitErfuellt: boolean
  pflicht: PflichtTest[]
  /** „Was fehlt noch?“ in Alltagssprache */
  wasFehlt: string[]
  wuenschenswertNichtErreicht: string[]
  aclRsiWarnung: string | null
  hinweise: string[]
}

const ZEICHEN = { '>': '>', '>=': '≥', '<': '<', '<=': '≤' } as const

function wertText(e: KriteriumErgebnis): string {
  const k = e.kriterium
  if (typeof e.wert === 'boolean') return e.wert ? 'ja' : 'nein'
  if (typeof e.wert === 'string') return e.wert
  if (typeof e.wert !== 'number') return '–'
  const nachkomma = k.art === 'lsi' ? 1 : (k.nachkomma ?? 1)
  return `${e.wert.toLocaleString('de-AT', { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma })}${einheit(k)}`
}

const einheit = (k: Kriterium) => (k.einheit === '%' ? ' %' : k.einheit ? ` ${k.einheit}` : '')

function zielText(e: KriteriumErgebnis): string {
  const k = e.kriterium
  if (k.art === 'auswahl') return k.erlaubt?.join(' / ') ?? ''
  if (k.art === 'janein') return 'ja'
  if (!e.schwelle || !k.vergleich) return ''
  return `${ZEICHEN[k.vergleich]} ${e.schwelle.wert.toLocaleString('de-AT')}${einheit(k)}`
}

/** Pflicht-Status eines Tests nach Ampel: nur grün zählt; Frauen-Regel (F26) blockiert nicht. */
export function pflichtStatus(a: TestAuswertung): { status: PflichtStatus; gruende: string[] } | null {
  const pflicht = a.ergebnis.kriterien.filter((e) => e.kriterium.status === 'pflicht' && e.zustand !== 'nicht_anwendbar' && e.zustand !== 'info')
  if (pflicht.length === 0) return null
  const gruende: string[] = []
  let fehlt = false
  for (const e of pflicht) {
    if (e.zustand === 'offen') {
      fehlt = true
      continue
    }
    const frauenAusnahme = !e.zaehlt && !!e.kriterium.frauenWuenschenswert
    if (e.ampel !== 'gruen' && !frauenAusnahme) gruende.push(`${e.kriterium.bezeichnung} ${wertText(e)} – Ziel ${zielText(e)}`)
  }
  if (gruende.length > 0) return { status: 'nicht_erfuellt', gruende }
  return { status: fehlt ? 'fehlt' : 'erfuellt', gruende: fehlt ? ['noch nicht (vollständig) gemessen'] : [] }
}

export function rtsVorschlag(
  testung: Pick<Testung, 'datum' | 'optionaleTests' | 'klinischAnders'>,
  patient: Pick<Patient, 'opDatum' | 'niveau' | 'konservativ'>,
  auswertung: Map<string, TestAuswertung>,
): RtsVorschlag {
  const regel = KATALOG.regeln.rts
  const tests = sichtbareTests(testung)

  const pflicht: PflichtTest[] = []
  for (const t of tests) {
    const a = auswertung.get(t.id)
    if (!a) continue
    const p = pflichtStatus(a)
    if (!p) continue
    const anders = testung.klinischAnders?.[t.id]
    const gilt = anders && anders.urteil !== '' && anders.begruendung.trim() !== ''
    pflicht.push({
      test: t,
      ampelStatus: p.status,
      status: gilt ? anders.urteil as 'erfuellt' | 'nicht_erfuellt' : p.status,
      klinischAnders: gilt ? { urteil: anders.urteil as 'erfuellt' | 'nicht_erfuellt', begruendung: anders.begruendung.trim() } : undefined,
      gruende: p.gruende,
    })
  }

  // Zeit seit OP bis zum Datum der Testung (Etappe-6-Frage 4)
  const testDatum = testung.datum ? new Date(`${testung.datum}T12:00:00`) : new Date()
  const monate = monateSeit(patient.opDatum, testDatum)
  const zeitErfuellt = monate !== null && monate >= regel.mindestMonate
  const ab = patient.konservativ ? 'Verletzung' : 'OP'

  const wasFehlt: string[] = []
  if (!zeitErfuellt) wasFehlt.push(`Zeit seit ${ab}: ${monate ?? '?'} Monate – mindestens ${regel.mindestMonate} Monate (${regel.quelle})`)
  for (const p of pflicht) {
    if (p.status === 'erfuellt') continue
    if (p.klinischAnders) wasFehlt.push(`${p.test.name}: klinisch als nicht erfüllt beurteilt – ${p.klinischAnders.begruendung}`)
    else if (p.status === 'fehlt') wasFehlt.push(`${p.test.name}: noch nicht gemessen`)
    else wasFehlt.push(`${p.test.name}: ${p.gruende.join('; ')}`)
  }

  const wuenschenswertNichtErreicht: string[] = []
  for (const t of tests) {
    for (const e of auswertung.get(t.id)?.ergebnis.kriterien ?? []) {
      if (e.kriterium.status === 'wuenschenswert' && e.zustand === 'bewertet' && e.ampel !== 'gruen')
        wuenschenswertNichtErreicht.push(`${t.name}: ${e.kriterium.bezeichnung} ${wertText(e)} – Ziel ${zielText(e)}`)
    }
  }

  const acl = auswertung.get('acl_rsi')?.ergebnis.kriterien.find((e) => e.kriterium.status === 'warnung')
  const aclRsiWarnung =
    acl && acl.zustand === 'bewertet' && acl.ampel !== 'gruen' ? `ACL-RSI ${wertText(acl)} – unter ${acl.schwelle?.wert} (psychologische Bereitschaft prüfen)` : null

  const hinweise: string[] = []
  if (patient.niveau === 'freizeit') hinweise.push(`Freizeit-Niveau: Read empfiehlt ${regel.freizeitEmpfehlungMonate} Monate bis zur Rückkehr.`)
  if (patient.konservativ) hinweise.push('Konservativ behandelt: Zeitregel ab dem Verletzungsdatum gerechnet.')
  if (pflicht.some((p) => p.klinischAnders)) hinweise.push('Mindestens ein Test wurde klinisch anders beurteilt (mit Begründung).')

  return {
    erfuellt: zeitErfuellt && pflicht.length > 0 && pflicht.every((p) => p.status === 'erfuellt'),
    monate,
    zeitErfuellt,
    pflicht,
    wasFehlt,
    wuenschenswertNichtErreicht,
    aclRsiWarnung,
    hinweise,
  }
}

export const RTS_TEXT = {
  erfuellt: 'Kriterien erfüllt',
  nicht_erfuellt: 'Kriterien (noch) nicht erfüllt',
} as const
