// Daten für die Verlaufsdiagramme auf der Seite eines Kürzels (Etappe-7-Frage 6):
// je Testung Bestwerte gesund/betroffen (bzw. ein Wert) und LSI bzw. Asymmetrie.
// Bremsphase (Meloq-Zusatzmetriken, Paper Sheth & Elis 2026 geprüft): nur zum Anschauen – ohne Ziel, Korridor und Ampel.

import { nachSeite } from '../berichte/nachvollziehbarkeit'
import type { Testung } from '../db'
import { KATALOG, phaseNach, testNach } from '../katalog'
import { istMeloqTest, zusatzFuer } from '../katalog/meloq'
import type { Kriterium, PhaseId } from '../katalog/typen'
import type { Patient } from '../patienten/stammdaten'
import { schwelleFuer, type Ampel } from '../rechnen/bewertung'
import { alsNewton, nProKg } from '../rechnen/einheiten'
import { ERFASSBARE_TESTS, monateBisTestung, phasenStand, sichtbareTests, werteAus, type TestAuswertung } from './ablauf'
import { ERFASSUNG, parseZahl } from './erfassung'
import { kernStrategie, zusatzZeilen } from './meloq'

export interface VerlaufOption {
  id: string
  name: string
  einheit: string
  /** zwei Linien (gesund/betroffen) oder eine */
  seiten: boolean
  /** zweites Diagramm: LSI (Ziel ≥ 90 %) oder Asymmetrie (Ziel < 10 %) */
  zweites?: { name: 'LSI' | 'Asymmetrie'; ziel: number }
  /** Satz unter dem Diagramm, wenn es kein Ziel gibt */
  hinweis?: string
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
  /** Monate seit OP mit Nachkommastellen – Lage auf der Zeitachse */
  genau: number | null
  /** Ampel des Kriteriums, das den Wert bzw. das zweite Diagramm bewertet (null = ohne Ampel) */
  ampelWert: Ampel | null
  ampelZweites: Ampel | null
}

const LSI = { name: 'LSI', ziel: 90 } as const
const ASYM = { name: 'Asymmetrie', ziel: 10 } as const

/** Meloq-Werte der Bremsphase, die als Verlauf wählbar sind (ohne Ziel). */
export const BREMSPHASE = ['peak_power_braking', 'net_peak_braking_force', 'rfd_braking'] as const
const BREMS_HINWEIS = 'Meloq-Wert der Bremsphase – nur zur Info, ohne Ziel und ohne Ampel.'

/** id `<test>:z_<metrik>`; Wert relativ (W/kg, N/kg, N/s) wie im Arztbericht in Klammern; CMJ links/rechts nach betroffener Seite. */
function bremsOptionen(testId: string, testName: string): VerlaufOption[] {
  if (!istMeloqTest(testId)) return []
  return zusatzFuer(testId)
    .filter((m) => (BREMSPHASE as readonly string[]).includes(m.id))
    .map((m) => {
      const seiten = testId !== 'cmj' || !!m.seitig
      return { id: `${testId}:z_${m.id}`, name: `${testName} – ${m.name}`, einheit: m.relativ ?? m.einheit, seiten, zweites: seiten ? (testId === 'cmj' ? ASYM : LSI) : undefined, hinweis: BREMS_HINWEIS }
    })
}

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
        ...bremsOptionen(t.id, t.name),
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
        ...bremsOptionen(t.id, t.name),
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
function punktWerte(option: VerlaufOption, testung: Testung, a: Map<string, TestAuswertung>, seite: Patient['seite'] | ''): Omit<VerlaufPunkt, 'testungId' | 'datum' | 'monate' | 'phase' | 'genau' | 'ampelWert' | 'ampelZweites'> {
  const [testId, strategie] = option.id.split(':')
  const aus = a.get(testId)
  const leer = { gesund: null, betroffen: null, wert: null, zweites: null }
  if (!aus) return leer
  const b = aus.berechnung
  const w = b.werte
  const zahl = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

  if (strategie?.startsWith('z_')) {
    const [z] = istMeloqTest(testId) ? zusatzZeilen(testId, testung.eingaben[testId] ?? {}, [strategie.slice(2)], parseZahl(testung.koerpergewichtKg)) : []
    if (!z) return leer
    const v = z.relativ ? z.relativ.werte : z.werte
    if (z.form === 'eins') return { ...leer, wert: v[0] }
    const s = z.form === 'lr' ? nachSeite(v[0], v[1], seite) : { gesund: v[0], betroffen: v[1] }
    return { ...leer, gesund: s?.gesund ?? null, betroffen: s?.betroffen ?? null, zweites: z.vergleich?.wert ?? null }
  }

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
  patient: Pick<Patient, 'opDatum' | 'geschlecht'> & Partial<Pick<Patient, 'seite'>>,
  testungen: readonly Testung[],
  option: VerlaufOption,
): VerlaufPunkt[] {
  return [...testungen]
    .sort((x, y) => x.datum.localeCompare(y.datum))
    .map((t) => {
      const phase = phasenStand(t, patient.opDatum).phase
      const a = werteAus(t, phase, patient.geschlecht)
      const k = kriterienFuer(option)
      return {
        testungId: t.id,
        datum: t.datum,
        monate: monateBisTestung(patient.opDatum, t.datum),
        genau: monateGenau(patient.opDatum, t.datum),
        phase,
        ...punktWerte(option, t, a, patient.seite ?? ''),
        ampelWert: ampelVon(a, option, k.wert),
        ampelZweites: ampelVon(a, option, k.zweites),
      }
    })
    .filter((p) => p.gesund !== null || p.betroffen !== null || p.wert !== null)
}

/** Monate seit OP mit Nachkommastellen (für die Lage auf der Zeitachse; die Phase rechnet weiter mit vollen Monaten). */
export function monateGenau(opDatum: string, datum: string): number | null {
  if (!opDatum || !datum) return null
  const tage = (new Date(`${datum}T12:00:00`).getTime() - new Date(`${opDatum}T12:00:00`).getTime()) / 86_400_000
  return Math.max(0, tage / 30.4375)
}

/** Welches vorhandene Kriterium die Werte im ersten bzw. zweiten Diagramm bewertet – Strategy-Werte haben keines. */
export function kriterienFuer(option: VerlaufOption): { wert?: Kriterium; zweites?: Kriterium } {
  const [testId, strategie] = option.id.split(':')
  const test = testNach(testId)
  const art = ERFASSUNG[testId]
  if (!test || !art || strategie) return {}
  const ids: Partial<Record<string, [string | undefined, string | undefined]>> = {
    kraft: ['relativ', 'lsi'],
    versuche: [undefined, 'lsi'],
    einzeln: [art.typ === 'einzeln' ? art.kriterium : undefined, 'lsi'],
    flexion: ['grad', 'lsi'],
    sl_sprung: ['hoehe', 'lsi'],
    sl_dj: ['hoehe', 'lsi'],
    cmj: ['hoehe', 'impuls_asymmetrie'],
    imtp: ['relativ', undefined],
    defizit: ['defizit', undefined],
    score: ['score', undefined],
    direkt: [art.typ === 'direkt' ? art.felder[0].kriterium : undefined, undefined],
  }
  const [w, z] = ids[art.typ] ?? [undefined, undefined]
  const finde = (id?: string) => (id ? test.kriterien.find((k) => k.id === id) : undefined)
  return { wert: finde(w), zweites: option.zweites ? finde(z) : undefined }
}

function ampelVon(a: Map<string, TestAuswertung>, option: VerlaufOption, k?: Kriterium): Ampel | null {
  if (!k) return null
  const e = a.get(option.id.split(':')[0])?.ergebnis.kriterien.find((x) => x.kriterium.id === k.id)
  return e && e.zustand === 'bewertet' && e.ampel ? e.ampel : null
}

export interface Zielkorridor {
  /** Schwelle je Abschnitt in Monaten seit OP (bis = null: offen) */
  stufen: { von: number; bis: number | null; wert: number }[]
  /** oben = Werte über der Schwelle sind erfüllt (> / ≥), unten = darunter (< / ≤) */
  richtung: 'oben' | 'unten'
  /** obere Grenze des gezeichneten Bereichs (nur LSI: 110 %, DESIGNKONZEPT 6) – ändert keine Ampel */
  grenze: number | null
  text: string
}

/** LSI-Zielbereich nach oben: ein LSI weit über 110 % ist ebenfalls auffällig (Bericht-Audit Punkt 24). */
export const LSI_OBERGRENZE = 110

/** Zielbereich aus den Schwellen der Phasen (config) – nichts Neues, nur die vorhandenen Grenzwerte über die Zeit. */
export function zielkorridor(k: Kriterium | undefined): Zielkorridor | null {
  if (!k || !k.vergleich) return null
  const stufen: Zielkorridor['stufen'] = []
  for (const p of KATALOG.phasen) {
    const s = schwelleFuer(k, p.id)
    if (!s) continue
    const letzte = stufen[stufen.length - 1]
    if (letzte && letzte.wert === s.wert && letzte.bis === p.vonMonat) letzte.bis = p.bisMonat
    else stufen.push({ von: p.vonMonat, bis: p.bisMonat, wert: s.wert })
  }
  if (stufen.length === 0) return null
  const richtung = k.vergleich === '>' || k.vergleich === '>=' ? 'oben' : 'unten'
  const zeichen = { '>': 'über', '>=': 'ab', '<': 'unter', '<=': 'bis' }[k.vergleich]
  const einheit = k.einheit === '%' ? ' %' : k.einheit ? ` ${k.einheit}` : ''
  const werte = [...new Set(stufen.map((x) => x.wert.toLocaleString('de-AT')))]
  const grenze = k.art === 'lsi' && richtung === 'oben' ? LSI_OBERGRENZE : null
  return {
    stufen,
    richtung,
    grenze,
    text: `Ziel: ${k.bezeichnung} ${zeichen} ${werte.join(' / ')}${einheit}${werte.length > 1 ? ' (je Phase)' : ''}${grenze ? ` (Bereich bis ${grenze} % markiert)` : ''}`,
  }
}

/** Testungen, in deren Testset der Test liegt, die aber keinen Wert dazu haben („nicht gemessen“). */
export function fehlendeMessungen(
  patient: Pick<Patient, 'opDatum' | 'geschlecht'> & Partial<Pick<Patient, 'seite'>>,
  testungen: readonly Testung[],
  option: VerlaufOption,
): { testungId: string; datum: string; genau: number | null; phase: PhaseId }[] {
  const testId = option.id.split(':')[0]
  const mitWert = new Set(verlaufsDaten(patient, testungen, option).map((p) => p.testungId))
  return [...testungen]
    .sort((x, y) => x.datum.localeCompare(y.datum))
    .filter((t) => !mitWert.has(t.id))
    .map((t) => ({ t, phase: phasenStand(t, patient.opDatum).phase }))
    .filter(({ t, phase }) => sichtbareTests(t, phase).some((x) => x.id === testId))
    .map(({ t, phase }) => ({ testungId: t.id, datum: t.datum, genau: monateGenau(patient.opDatum, t.datum), phase }))
}

/** Nur Verlaufsgrößen, zu denen es mindestens einen Wert gibt. */
export function verfuegbareOptionen(patient: Pick<Patient, 'opDatum' | 'geschlecht'> & Partial<Pick<Patient, 'seite'>>, testungen: readonly Testung[]): VerlaufOption[] {
  return VERLAUF_OPTIONEN.filter((o) => verlaufsDaten(patient, testungen, o).length > 0)
}

/** Phasengrenzen in Monaten seit OP (für die Zeitachse der Diagramme). */
export const PHASEN_MONATE: readonly { name: string; von: number; bis: number | null }[] = KATALOG.phasen.map((p) => ({ name: p.name, von: p.vonMonat, bis: p.bisMonat }))

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
