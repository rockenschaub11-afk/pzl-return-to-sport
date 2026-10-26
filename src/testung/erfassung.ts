// Was je Test eingegeben wird und wie daraus die Werte für die Bewertung entstehen
// (docs/ENTSCHEIDUNGEN.md 3, 4, 6; Etappe-4-Fragen 4–9).
// Eingaben werden als Text gespeichert, genau wie getippt („7,5“) – gerechnet wird erst hier.

import { KATALOG } from '../katalog'
import type { TestDef } from '../katalog/typen'
import type { Eingabe } from '../rechnen/bewertung'
import { alsNewton, nmProKg, nProKg, nsProKg } from '../rechnen/einheiten'
import { asymmetrie, bestwert, lsi, variationskoeffizient } from '../rechnen/versuche'

/** Felder eines Tests, z. B. { g1: '21,4', b1: '18,9', einheit: 'kg' } */
export type TestEingabe = Record<string, string>

export type Erfassung =
  | { typ: 'auswahl' }
  | { typ: 'defizit' }
  | { typ: 'flexion' }
  | { typ: 'janein' }
  | { typ: 'kraft' }
  | { typ: 'cmj' }
  | { typ: 'sl_sprung' }
  | { typ: 'sl_dj' }
  | { typ: 'imtp' }
  | { typ: 'versuche'; einheit: 'cm' | 's' }
  /** ein Wert je Seite; kriterium = welches Kriterium den Wert der betroffenen Seite bekommt */
  | { typ: 'einzeln'; einheit: string; kriterium: string }
  /** Werte direkt wie am Gerät abgelesen, je Feld ein Kriterium (Verlaufstests, Etappe 7) */
  | { typ: 'direkt'; felder: { kriterium: string; label: string; einheit: string }[] }
  | { typ: 'score' }
  | { typ: 'koos' }

export const ERFASSUNG: Record<string, Erfassung> = {
  erguss: { typ: 'auswahl' },
  rom_extension: { typ: 'defizit' },
  rom_flexion: { typ: 'flexion' },
  slr: { typ: 'janein' },
  hhd_knie_ext: { typ: 'kraft' },
  hhd_knie_flex: { typ: 'kraft' },
  hhd_hueft_abd: { typ: 'kraft' },
  plantarflexion: { typ: 'kraft' },
  cmj: { typ: 'cmj' },
  sl_cmj: { typ: 'sl_sprung' },
  sl_dj: { typ: 'sl_dj' },
  imtp: { typ: 'imtp' },
  single_hop: { typ: 'versuche', einheit: 'cm' },
  triple_hop: { typ: 'versuche', einheit: 'cm' },
  crossover_hop: { typ: 'versuche', einheit: 'cm' },
  timed_hop: { typ: 'versuche', einheit: 's' },
  side_hop: { typ: 'einzeln', einheit: 'Wdh.', kriterium: 'wdh' },
  sl_bridge: { typ: 'einzeln', einheit: 'Wdh.', kriterium: 'wdh' },
  sl_calf_raise: { typ: 'einzeln', einheit: 'Wdh.', kriterium: 'wdh' },
  sl_sit_to_stand: { typ: 'einzeln', einheit: 'Wdh.', kriterium: 'wdh' },
  // Verlaufstests (Etappe 7)
  sl_squat: { typ: 'einzeln', einheit: '°', kriterium: 'winkel' },
  sl_balance: { typ: 'einzeln', einheit: 'mm', kriterium: 'schwankweg' },
  bridge_beidbeinig: { typ: 'direkt', felder: [{ kriterium: 'wdh', label: 'Wiederholungen', einheit: 'Wdh.' }] },
  calf_raise_beidbeinig: { typ: 'direkt', felder: [{ kriterium: 'wdh', label: 'Wiederholungen', einheit: 'Wdh.' }] },
  kniebeuge_asym: { typ: 'direkt', felder: [{ kriterium: 'asymmetrie', label: 'Asymmetrie (Meloq)', einheit: '%' }] },
  hop_platte: { typ: 'direkt', felder: [{ kriterium: 'impuls_asymmetrie', label: 'Impuls-Asymmetrie (Meloq)', einheit: '%' }] },
  dj_bilateral: {
    typ: 'direkt',
    felder: [
      { kriterium: 'hoehe', label: 'Sprunghöhe (bester Versuch)', einheit: 'cm' },
      { kriterium: 'asymmetrie', label: 'Asymmetrie (Meloq)', einheit: '%' },
    ],
  },
  acl_rsi: { typ: 'score' },
  ikdc: { typ: 'score' },
  tampa: { typ: 'score' },
  koos: { typ: 'koos' },
}

export const KOOS_SUBSKALEN = [
  ['symptome', 'Symptome'],
  ['schmerz', 'Schmerz'],
  ['alltag', 'Alltag (ADL)'],
  ['sport', 'Sport/Freizeit'],
  ['lebensqualitaet', 'Lebensqualität'],
] as const

export const VERSUCHE = [1, 2, 3] as const

/** „7,5“ → 7.5; leer oder unlesbar → null */
export function parseZahl(text: string | undefined): number | null {
  if (text === undefined) return null
  const t = text.trim().replace(/\s/g, '').replace(',', '.')
  if (t === '' || t === '-' || t === '.') return null
  const z = Number(t)
  return Number.isFinite(z) ? z : null
}

export interface Seitenwerte {
  gesund: number | null
  betroffen: number | null
  einheit: string
}

export interface Berechnung {
  /** Werte je Kriterium-id, bereit für bewerteTest */
  werte: Record<string, Eingabe>
  /** Bestwerte je Seite zur Anzeige */
  seiten?: Seitenwerte
  /** LSI zur Vorverletzung (F22) */
  lsiVorverletzung: number | null
  /** Seiten, deren Versuche zu stark streuen (Read: > 10 %) */
  streuung: { seite: 'gesund' | 'betroffen' | 'beide'; cv: number }[]
  /** Nm/kg, wenn ein Hebelarm angegeben ist */
  nmProKg?: { gesund: number | null; betroffen: number | null }
  /** relative Werte brauchen das Körpergewicht */
  brauchtKoerpergewicht: boolean
  /** gewerteter Versuch (größte Sprunghöhe) – für Kern-Satz und Zusatzmetriken */
  besterVersuch: Partial<Record<'gesamt' | 'gesund' | 'betroffen', number>>
}

interface Kontext {
  koerpergewichtKg: number | null
  regeln?: typeof KATALOG.regeln
}

const versuche = (e: TestEingabe, praefix: string, feld?: string) =>
  VERSUCHE.map((n) => parseZahl(e[`${praefix}${n}${feld ? `_${feld}` : ''}`]))

/** Versuch mit der größten Sprunghöhe – seine Werte zählen gemeinsam (Etappe-4-Frage 5). */
function besterSprung(e: TestEingabe, praefix: string, felder: string[]) {
  let bester: Record<string, number | null> | null = null
  for (const n of VERSUCHE) {
    const h = parseZahl(e[`${praefix}${n}_hoehe`])
    if (h === null) continue
    if (!bester || h > (bester.hoehe ?? -Infinity)) {
      bester = { hoehe: h, n }
      for (const f of felder) bester[f] = parseZahl(e[`${praefix}${n}_${f}`])
    }
  }
  return bester
}

export function berechne(test: TestDef, e: TestEingabe, kontext: Kontext): Berechnung {
  const art = ERFASSUNG[test.id]
  const kg = kontext.koerpergewichtKg && kontext.koerpergewichtKg > 0 ? kontext.koerpergewichtKg : null
  const grenze = (kontext.regeln ?? KATALOG.regeln).variationskoeffizientWarnungUeber
  const zeitTest = !!test.zeitTest
  const ergebnis: Berechnung = { werte: {}, lsiVorverletzung: null, streuung: [], brauchtKoerpergewicht: false, besterVersuch: {} }
  const merke = (wo: 'gesamt' | 'gesund' | 'betroffen', s: Record<string, number | null> | null) => {
    if (s?.n) ergebnis.besterVersuch[wo] = s.n
  }

  const pruefeStreuung = (werte: (number | null)[], seite: 'gesund' | 'betroffen' | 'beide') => {
    const cv = variationskoeffizient(werte)
    if (cv !== null && cv > grenze) ergebnis.streuung.push({ seite, cv })
  }
  const vorverletzung = (betroffen: number | null, umrechnen: (v: number) => number = (v) => v) => {
    const vor = parseZahl(e.vor)
    if (vor !== null && betroffen !== null) ergebnis.lsiVorverletzung = lsi(betroffen, umrechnen(vor), zeitTest)
  }

  switch (art?.typ) {
    case 'auswahl':
      ergebnis.werte.grad = e.wert || null
      break
    case 'defizit':
      ergebnis.werte.defizit = parseZahl(e.wert)
      break
    case 'janein':
      ergebnis.werte.ohne_lag = e.wert === 'ja' ? true : e.wert === 'nein' ? false : null
      break
    case 'flexion': {
      const g = parseZahl(e.g)
      const b = parseZahl(e.b)
      ergebnis.werte.grad = b
      ergebnis.werte.lsi = g !== null && b !== null ? lsi(b, g) : null
      ergebnis.seiten = { gesund: g, betroffen: b, einheit: '°' }
      break
    }
    case 'kraft': {
      const einheit = e.einheit === 'N' ? 'N' : 'kg'
      const gV = versuche(e, 'g')
      const bV = versuche(e, 'b')
      pruefeStreuung(gV, 'gesund')
      pruefeStreuung(bV, 'betroffen')
      const g = bestwert(gV)
      const b = bestwert(bV)
      const gN = g === null ? null : alsNewton(g, einheit)
      const bN = b === null ? null : alsNewton(b, einheit)
      ergebnis.seiten = { gesund: g, betroffen: b, einheit }
      ergebnis.werte.lsi = gN !== null && bN !== null ? lsi(bN, gN) : null
      ergebnis.brauchtKoerpergewicht = test.kriterien.some((k) => k.id === 'relativ')
      ergebnis.werte.relativ = bN !== null && kg ? nProKg(bN, kg) : null
      const hebel = parseZahl(e.hebel)
      if (hebel && kg) {
        ergebnis.nmProKg = {
          gesund: gN === null ? null : nmProKg(gN, hebel, kg),
          betroffen: bN === null ? null : nmProKg(bN, hebel, kg),
        }
      }
      vorverletzung(bN, (v) => alsNewton(v, einheit))
      break
    }
    case 'cmj': {
      pruefeStreuung(versuche(e, 'v', 'hoehe'), 'beide')
      const s = besterSprung(e, 'v', ['impL', 'impR'])
      merke('gesamt', s)
      ergebnis.werte.hoehe = s?.hoehe ?? null
      const l = s?.impL ?? null
      const r = s?.impR ?? null
      ergebnis.werte.impuls_asymmetrie = l !== null && r !== null ? asymmetrie(l, r) : null
      ergebnis.brauchtKoerpergewicht = true
      ergebnis.werte.net_impulse = l !== null && r !== null && kg ? nsProKg(l + r, kg) : null
      break
    }
    case 'sl_sprung': {
      pruefeStreuung(versuche(e, 'g', 'hoehe'), 'gesund')
      pruefeStreuung(versuche(e, 'b', 'hoehe'), 'betroffen')
      const g = besterSprung(e, 'g', ['imp'])
      const b = besterSprung(e, 'b', ['imp'])
      merke('gesund', g)
      merke('betroffen', b)
      const gh = g?.hoehe ?? null
      const bh = b?.hoehe ?? null
      ergebnis.seiten = { gesund: gh, betroffen: bh, einheit: 'cm' }
      ergebnis.werte.hoehe = bh
      ergebnis.werte.lsi = gh !== null && bh !== null ? lsi(bh, gh) : null
      const gi = g?.imp ?? null
      const bi = b?.imp ?? null
      ergebnis.werte.impuls_asymmetrie = gi !== null && bi !== null ? asymmetrie(gi, bi) : null
      ergebnis.brauchtKoerpergewicht = true
      ergebnis.werte.net_impulse = bi !== null && kg ? nsProKg(bi, kg) : null
      vorverletzung(bh)
      break
    }
    case 'sl_dj': {
      pruefeStreuung(versuche(e, 'g', 'hoehe'), 'gesund')
      pruefeStreuung(versuche(e, 'b', 'hoehe'), 'betroffen')
      const g = besterSprung(e, 'g', ['rsi'])
      const b = besterSprung(e, 'b', ['rsi'])
      merke('gesund', g)
      merke('betroffen', b)
      const gh = g?.hoehe ?? null
      const bh = b?.hoehe ?? null
      ergebnis.seiten = { gesund: gh, betroffen: bh, einheit: 'cm' }
      ergebnis.werte.hoehe = bh
      ergebnis.werte.lsi = gh !== null && bh !== null ? lsi(bh, gh) : null
      ergebnis.werte.rsi = b?.rsi ?? null
      vorverletzung(bh)
      break
    }
    case 'imtp': {
      const einheit = e.einheit === 'N' ? 'N' : 'kg'
      const v = versuche(e, 'v')
      pruefeStreuung(v, 'beide')
      const best = bestwert(v)
      ergebnis.brauchtKoerpergewicht = true
      ergebnis.werte.relativ = best !== null && kg ? nProKg(alsNewton(best, einheit), kg) : null
      break
    }
    case 'versuche': {
      const gV = versuche(e, 'g')
      const bV = versuche(e, 'b')
      pruefeStreuung(gV, 'gesund')
      pruefeStreuung(bV, 'betroffen')
      const g = bestwert(gV, zeitTest)
      const b = bestwert(bV, zeitTest)
      ergebnis.seiten = { gesund: g, betroffen: b, einheit: art.einheit }
      ergebnis.werte.lsi = g !== null && b !== null ? lsi(b, g, zeitTest) : null
      vorverletzung(b)
      break
    }
    case 'einzeln': {
      const g = parseZahl(e.g)
      const b = parseZahl(e.b)
      ergebnis.seiten = { gesund: g, betroffen: b, einheit: art.einheit }
      ergebnis.werte[art.kriterium] = b
      ergebnis.werte.lsi = g !== null && b !== null ? lsi(b, g) : null
      vorverletzung(b)
      break
    }
    case 'score':
      ergebnis.werte.score = parseZahl(e.wert)
      break
    case 'direkt':
      for (const f of art.felder) ergebnis.werte[f.kriterium] = parseZahl(e[f.kriterium])
      break
    case 'koos':
      break
  }
  return ergebnis
}

/** Hat der Test schon irgendeine Eingabe? (für „optional“ und die Übersicht) */
export function hatEingabe(e: TestEingabe | undefined): boolean {
  if (!e) return false
  return Object.entries(e).some(([k, v]) => !['einheit', 'winkel', 'box'].includes(k) && v.trim() !== '')
}
