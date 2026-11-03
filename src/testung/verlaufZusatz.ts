// Zusatz zu den Verlaufsdiagrammen (Visualisierung Stufe 1, Konzept D) – ändert keinen Wert, keine Ampel und keinen Korridor:
// 1. Spanne der Einzelversuche je Testung (kleinster bis größter Versuch; beim LSI alle Kombinationen),
// 2. Normdaten „typisch nach VKB-OP“ (VALD) an ihrem eigenen Zeitpunkt – nur bei genau passender Gruppe wie in der Testkarte.

import { rohdaten } from '../berichte/nachvollziehbarkeit'
import type { Testung } from '../db'
import { testNach } from '../katalog'
import type { Patient } from '../patienten/stammdaten'
import { alsNewton, nProKg } from '../rechnen/einheiten'
import { lsiSpanne, spanne } from '../rechnen/spanne'
import { phasenStand, werteAus } from './ablauf'
import { ERFASSUNG, parseZahl } from './erfassung'
import { altersband, NORMDATEN } from './normdaten'
import type { VerlaufOption } from './verlauf'

export type Spanne = [number, number] | null

export interface Spannen {
  gesund: Spanne
  betroffen: Spanne
  /** ein Wert (beidbeinig) */
  wert: Spanne
  /** LSI aus allen Kombinationen der Versuche */
  zweites: Spanne
}

const KEINE: Spannen = { gesund: null, betroffen: null, wert: null, zweites: null }

/** Spanne der Versuche einer Testung in der Einheit des Diagramms (Kraft in N/kg). Strategy- und Meloq-Zusatzwerte: keine. */
export function spannenFuer(option: VerlaufOption, testung: Testung, patient: Pick<Patient, 'opDatum' | 'geschlecht'>): Spannen {
  const [testId, zusatz] = option.id.split(':')
  const test = testNach(testId)
  if (zusatz || !test) return KEINE
  const phase = phasenStand(testung, patient.opDatum).phase
  const b = werteAus(testung, phase, patient.geschlecht).get(testId)?.berechnung
  const e = testung.eingaben[testId] ?? {}
  const roh = b ? rohdaten(test, e, b) : null
  if (!roh) return KEINE
  const zeile = (s: 'gesund' | 'betroffen' | 'beidbeinig') => roh.zeilen.find((z) => z.seite === s)?.werte ?? []
  const typ = ERFASSUNG[testId]?.typ
  const kg = parseZahl(testung.koerpergewichtKg)
  const relativ = (werte: (number | null)[]) => {
    if (typ !== 'kraft' && typ !== 'imtp') return werte
    if (!kg) return []
    const einheit = roh.einheit === 'N' ? 'N' : 'kg'
    return werte.map((v) => (v === null ? null : nProKg(alsNewton(v, einheit), kg)))
  }
  if (typ === 'cmj' || typ === 'imtp') return { ...KEINE, wert: spanne(relativ(zeile('beidbeinig'))) }
  return {
    gesund: spanne(relativ(zeile('gesund'))),
    betroffen: spanne(relativ(zeile('betroffen'))),
    wert: null,
    zweites: option.zweites?.name === 'LSI' ? lsiSpanne(zeile('gesund'), zeile('betroffen'), !!test.zeitTest) : null,
  }
}

export interface NormMarke {
  /** Monate seit OP (6, 9, 12) */
  monate: number
  /** Index der Reihe im Diagramm (0 = gesund bzw. einziger Wert, 1 = betroffen) */
  reihe: number
  mittel: number
  von?: number
  bis?: number
}

export interface Normen {
  erstes: NormMarke[]
  zweites: NormMarke[]
  /** z. B. „Grau: typisch nach VKB-OP (VALD, männlich 20–30, Mittelwert ±1 SD)“ */
  text: string
}

/** Datum = OP-Datum + Monate (für das Altersband zum Normzeitpunkt). */
function datumNach(opDatum: string, monate: number): string {
  const d = new Date(`${opDatum}T12:00:00`)
  d.setMonth(d.getMonth() + monate)
  return d.toISOString().slice(0, 10)
}

/**
 * Normwerte für ein Verlaufsdiagramm – nur bei genau passender Gruppe (Geschlecht, Altersband zum Normzeitpunkt) und gleicher Einheit.
 * Vergleichsgruppe ohne Verletzung bleibt draußen: hier geht es um „typisch nach VKB-OP“.
 */
export function normenFuer(option: VerlaufOption, patient: Pick<Patient, 'opDatum' | 'geschlecht'> & Partial<Pick<Patient, 'geburtsjahr'>>): Normen | null {
  const [testId, zusatz] = option.id.split(':')
  if (zusatz || !patient.opDatum || !patient.geburtsjahr || (patient.geschlecht !== 'weiblich' && patient.geschlecht !== 'maennlich')) return null
  const erstes: NormMarke[] = []
  const zweites: NormMarke[] = []
  const baender = new Set<string>()
  for (const g of NORMDATEN.gruppen) {
    if (g.geschlecht !== patient.geschlecht || altersband(patient.geburtsjahr, datumNach(patient.opDatum, g.monate)) !== g.alter) continue
    for (const w of g.werte) {
      if (w.test !== testId || w.vergleich) continue
      const marke = { monate: g.monate, mittel: w.mittel, von: w.von, bis: w.bis }
      if (w.einheit === '%' && w.name === 'LSI' && option.zweites?.name === 'LSI') {
        zweites.push({ ...marke, reihe: 0 })
      } else if (w.einheit === option.einheit && w.name !== 'LSI') {
        if (option.seiten && !w.seite) continue
        if (!option.seiten && w.seite) continue
        erstes.push({ ...marke, reihe: w.seite === 'betroffen' ? 1 : 0 })
      } else continue
      baender.add(g.alter)
    }
  }
  if (erstes.length === 0 && zweites.length === 0) return null
  const band = [...baender].map((id) => NORMDATEN.altersbaender.find((b) => b.id === id)?.name ?? id).join(', ')
  const sd = [...erstes, ...zweites].some((n) => n.von !== undefined)
  const hinweis = NORMDATEN.hinweise[testId]
  return {
    erstes,
    zweites,
    text: `Grau: typisch nach VKB-OP (${NORMDATEN.quelle}, ${patient.geschlecht === 'weiblich' ? 'weiblich' : 'männlich'} ${band}; ${sd ? 'Strich = Mittelwert, Balken = ±1 SD' : 'Strich = Mittelwert'}${option.seiten && erstes.length > 0 ? ', gesund gestrichelt' : ''}) – ohne Einfluss auf die Ampel${hinweis ? `. ${hinweis}` : ''}`,
  }
}
