// Daten für die Verlaufsdiagramme auf der Seite eines Kürzels (Etappe-7-Frage 6):
// je Testung Bestwerte gesund/betroffen (bzw. ein Wert) und LSI bzw. Asymmetrie.

import type { Testung } from '../db'
import { phaseNach } from '../katalog'
import type { PhaseId } from '../katalog/typen'
import type { Patient } from '../patienten/stammdaten'
import { alsNewton, nProKg } from '../rechnen/einheiten'
import { ERFASSBARE_TESTS, monateBisTestung, phasenStand, werteAus, type TestAuswertung } from './ablauf'
import { ERFASSUNG, parseZahl } from './erfassung'
import { kernStrategie } from './meloq'

export interface VerlaufOption {
  id: string
  name: string
  einheit: string
  /** zwei Linien (gesund/betroffen) oder eine */
  seiten: boolean
  /** zweites Diagramm: LSI (Ziel ≥ 90 %) oder Asymmetrie (Ziel < 10 %) */
  zweites?: { name: 'LSI' | 'Asymmetrie'; ziel: number }
}

export interface VerlaufPunkt {
  testungId: string
  datum: string
  monate: number | null
  phase: PhaseId
  gesund: number | null
  betroffen: number | null
  /** ein Wert (wenn seiten = false) */
  wert: number | null
  zweites: number | null
}

const LSI = { name: 'LSI', ziel: 90 } as const
const ASYM = { name: 'Asymmetrie', ziel: 10 } as const

/** Alle denkbaren Verlaufsgrößen in Katalog-Reihenfolge, Strategy-Werte (ENTSCHEIDUNGEN 6.4) dazu. */
export const VERLAUF_OPTIONEN: readonly VerlaufOption[] = ERFASSBARE_TESTS.flatMap((t): VerlaufOption[] => {
  const art = ERFASSUNG[t.id]
  switch (art.typ) {
    case 'kraft':
      return [{ id: t.id, name: `${t.name} – Kraft relativ`, einheit: 'N/kg', seiten: true, zweites: LSI }]
    case 'versuche':
      return [{ id: t.id, name: t.name, einheit: art.einheit, seiten: true, zweites: LSI }]
    case 'einzeln':
      return [{ id: t.id, name: t.name, einheit: art.einheit, seiten: true, zweites: t.seitenvergleich ? LSI : undefined }]
    case 'flexion':
      return [{ id: t.id, name: t.name, einheit: '°', seiten: true, zweites: { name: 'LSI', ziel: 95 } }]
    case 'sl_sprung':
      return [
        { id: t.id, name: `${t.name} – Sprunghöhe`, einheit: 'cm', seiten: true, zweites: LSI },
        { id: `${t.id}:ct`, name: `${t.name} – Contraction Time`, einheit: 'ms', seiten: true, zweites: LSI },
      ]
    case 'sl_dj':
      return [
        { id: t.id, name: `${t.name} – Sprunghöhe`, einheit: 'cm', seiten: true, zweites: LSI },
        { id: `${t.id}:kz`, name: `${t.name} – Kontaktzeit`, einheit: 'ms', seiten: true, zweites: LSI },
      ]
    case 'cmj':
      return [
        { id: t.id, name: `${t.name} – Sprunghöhe`, einheit: 'cm', seiten: false, zweites: ASYM },
        { id: `${t.id}:ct`, name: `${t.name} – Contraction Time`, einheit: 'ms', seiten: false },
      ]
    case 'imtp':
      return [{ id: t.id, name: `${t.name} – relativ`, einheit: 'N/kg', seiten: false }]
    case 'defizit':
      return [{ id: t.id, name: t.name, einheit: '°', seiten: false }]
    case 'score':
      return [{ id: t.id, name: t.name, einheit: 'Punkte', seiten: false }]
    case 'direkt':
      return [{ id: t.id, name: `${t.name} – ${art.felder[0].label}`, einheit: art.felder[0].einheit, seiten: false }]
    default:
      return []
  }
})

/** Werte einer Verlaufsgröße aus einer ausgewerteten Testung. */
function punktWerte(option: VerlaufOption, testung: Testung, a: Map<string, TestAuswertung>): Omit<VerlaufPunkt, 'testungId' | 'datum' | 'monate' | 'phase'> {
  const [testId, strategie] = option.id.split(':')
  const aus = a.get(testId)
  const leer = { gesund: null, betroffen: null, wert: null, zweites: null }
  if (!aus) return leer
  const b = aus.berechnung
  const w = b.werte
  const zahl = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

  if (strategie) {
    const k = kernStrategie(testId as 'cmj' | 'sl_cmj' | 'sl_dj', testung.eingaben[testId] ?? {}, b)
    if (k.form === 'eins') return { ...leer, wert: k.werte[0] }
    return { ...leer, gesund: k.werte[0], betroffen: k.werte[1], zweites: k.vergleich?.wert ?? null }
  }

  switch (ERFASSUNG[testId].typ) {
    case 'kraft': {
      const kg = parseZahl(testung.koerpergewichtKg)
      const einheit = b.seiten?.einheit === 'N' ? 'N' : 'kg'
      const rel = (v: number | null | undefined) => (v === null || v === undefined || !kg ? null : nProKg(alsNewton(v, einheit), kg))
      return { ...leer, gesund: rel(b.seiten?.gesund), betroffen: rel(b.seiten?.betroffen), zweites: zahl(w.lsi) }
    }
    case 'cmj':
      return { ...leer, wert: zahl(w.hoehe), zweites: zahl(w.impuls_asymmetrie) }
    case 'imtp':
      return { ...leer, wert: zahl(w.relativ) }
    case 'defizit':
      return { ...leer, wert: zahl(w.defizit) }
    case 'score':
      return { ...leer, wert: zahl(w.score) }
    case 'direkt': {
      const art = ERFASSUNG[testId]
      return { ...leer, wert: art.typ === 'direkt' ? zahl(w[art.felder[0].kriterium]) : null }
    }
    default:
      return { ...leer, gesund: b.seiten?.gesund ?? null, betroffen: b.seiten?.betroffen ?? null, zweites: zahl(w.lsi) }
  }
}

/** Verlaufspunkte je Testung (nach Datum sortiert), nur Testungen mit Werten. */
export function verlaufsDaten(
  patient: Pick<Patient, 'opDatum' | 'geschlecht'>,
  testungen: readonly Testung[],
  option: VerlaufOption,
): VerlaufPunkt[] {
  return [...testungen]
    .sort((x, y) => x.datum.localeCompare(y.datum))
    .map((t) => {
      const phase = phasenStand(t, patient.opDatum).phase
      return {
        testungId: t.id,
        datum: t.datum,
        monate: monateBisTestung(patient.opDatum, t.datum),
        phase,
        ...punktWerte(option, t, werteAus(t, phase, patient.geschlecht)),
      }
    })
    .filter((p) => p.gesund !== null || p.betroffen !== null || p.wert !== null)
}

/** Nur Verlaufsgrößen, zu denen es mindestens einen Wert gibt. */
export function verfuegbareOptionen(patient: Pick<Patient, 'opDatum' | 'geschlecht'>, testungen: readonly Testung[]): VerlaufOption[] {
  return VERLAUF_OPTIONEN.filter((o) => verlaufsDaten(patient, testungen, o).length > 0)
}

/** Phasenbänder als Datumsbereiche ab OP (für den Hintergrund der Diagramme). */
export function phasenBaender(opDatum: string): { phase: PhaseId; name: string; von: Date; bis: Date | null }[] {
  const op = new Date(`${opDatum}T12:00:00`)
  const plus = (m: number) => {
    const d = new Date(op)
    d.setMonth(d.getMonth() + m)
    return d
  }
  return (['frueh', 'mitte', 'spaet', 'rtt', 'rtc'] as PhaseId[]).map((id) => {
    const p = phaseNach(id)
    return { phase: id, name: p.name, von: plus(p.vonMonat), bis: p.bisMonat === null ? null : plus(p.bisMonat) }
  })
}
