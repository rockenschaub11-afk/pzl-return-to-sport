// Bewertung je Kriterium und je Test (docs/ENTSCHEIDUNGEN.md 3 und 4).
// Ampel richtet sich nach der angezeigten (gerundeten) Zahl.

import { KATALOG } from '../katalog'
import { PHASEN_IDS, type Kriterium, type PhaseId, type Regeln, type TestDef, type Vergleich } from '../katalog/typen'
import type { Geschlecht } from '../patienten/stammdaten'
import { gerundet } from './versuche'

export type Ampel = 'gruen' | 'gelb' | 'rot'

export interface Schwelle {
  wert: number
  /** true, wenn der Wert aus einer früheren Phase übernommen wurde */
  uebernommen: boolean
  vonPhase: PhaseId | 'alle'
}

/**
 * Schwelle eines Kriteriums in einer Phase. Leere Phase übernimmt den Wert der Phase davor;
 * gibt es davor keinen Wert, gilt das Kriterium in dieser Phase nicht (null).
 */
export function schwelleFuer(k: Kriterium, phase: PhaseId): Schwelle | null {
  if (k.werte.alle !== undefined) return { wert: k.werte.alle, uebernommen: false, vonPhase: 'alle' }
  const bis = PHASEN_IDS.indexOf(phase)
  for (let i = bis; i >= 0; i--) {
    const w = k.werte[PHASEN_IDS[i]]
    if (w !== undefined) return { wert: w, uebernommen: i !== bis, vonPhase: PHASEN_IDS[i] }
  }
  return null
}

export function vergleiche(wert: number, vergleich: Vergleich, schwelle: number): boolean {
  switch (vergleich) {
    case '>':
      return wert > schwelle
    case '>=':
      return wert >= schwelle
    case '<':
      return wert < schwelle
    case '<=':
      return wert <= schwelle
  }
}

export type Eingabe = number | string | boolean | null | undefined

export interface KriteriumErgebnis {
  kriterium: Kriterium
  /** offen = kein Wert; nicht_anwendbar = gilt in dieser Phase nicht; info = ohne Ampel */
  zustand: 'bewertet' | 'offen' | 'nicht_anwendbar' | 'info'
  ampel?: Ampel
  /** der verglichene (gerundete) Wert */
  wert?: number | string | boolean
  schwelle?: Schwelle
  /** zählt für die Gesamt-Ampel des Tests */
  zaehlt: boolean
  hinweis?: string
}

const NACHKOMMA_LSI = 1

export function bewerteKriterium(
  k: Kriterium,
  phase: PhaseId,
  eingabe: Eingabe,
  optionen: { geschlecht?: Geschlecht | ''; regeln?: Regeln } = {},
): KriteriumErgebnis {
  const regeln = optionen.regeln ?? KATALOG.regeln
  const zaehltStatus = k.status === 'pflicht' || k.status === 'wuenschenswert'
  const leer = eingabe === null || eingabe === undefined || eingabe === ''

  if (k.art === 'auswahl') {
    if (leer) return { kriterium: k, zustand: 'offen', zaehlt: false }
    const ok = k.erlaubt?.includes(String(eingabe)) ?? false
    return { kriterium: k, zustand: 'bewertet', ampel: ok ? 'gruen' : 'rot', wert: String(eingabe), zaehlt: zaehltStatus }
  }
  if (k.art === 'janein') {
    if (leer) return { kriterium: k, zustand: 'offen', zaehlt: false }
    return { kriterium: k, zustand: 'bewertet', ampel: eingabe === true ? 'gruen' : 'rot', wert: eingabe === true, zaehlt: zaehltStatus }
  }

  const schwelle = schwelleFuer(k, phase)
  const nachkomma = k.art === 'lsi' ? NACHKOMMA_LSI : (k.nachkomma ?? 1)
  const zahl = typeof eingabe === 'number' && Number.isFinite(eingabe) ? gerundet(eingabe, nachkomma) : null

  if (!schwelle || !k.vergleich) {
    // ohne Schwelle (z. B. IKDC) oder in dieser Phase nicht definiert
    return {
      kriterium: k,
      zustand: schwelle === null && Object.keys(k.werte).length > 0 ? 'nicht_anwendbar' : 'info',
      wert: zahl ?? undefined,
      zaehlt: false,
    }
  }
  if (zahl === null) return { kriterium: k, zustand: 'offen', schwelle, zaehlt: false }

  const erfuellt = vergleiche(zahl, k.vergleich, schwelle.wert)

  if (k.status === 'info' || k.status === 'warnung') {
    return {
      kriterium: k,
      zustand: k.status === 'info' ? 'info' : 'bewertet',
      ampel: erfuellt ? 'gruen' : k.status === 'warnung' ? 'gelb' : undefined,
      wert: zahl,
      schwelle,
      zaehlt: false,
      hinweis: k.status === 'warnung' && !erfuellt ? `${k.bezeichnung} unter ${schwelle.wert} – Warnung (blockiert nicht)` : undefined,
    }
  }

  let ampel: Ampel = erfuellt ? 'gruen' : 'rot'
  // LSI dreistufig: gelb zwischen gelbAb und Schwelle (F22)
  if (k.art === 'lsi' && !erfuellt && (k.ampel ?? 'dreistufig') === 'dreistufig' && zahl >= regeln.lsi.gelbAb) ampel = 'gelb'

  // Frauen-Regel (F26): Read-Absolutwert nur wünschenswert, der Test wird dadurch nicht rot
  if (!erfuellt && k.frauenWuenschenswert && optionen.geschlecht === 'weiblich') {
    return { kriterium: k, zustand: 'bewertet', ampel, wert: zahl, schwelle, zaehlt: false, hinweis: regeln.frauenHinweis }
  }

  return { kriterium: k, zustand: 'bewertet', ampel, wert: zahl, schwelle, zaehlt: true }
}

export interface TestErgebnis {
  test: TestDef
  /** null = noch nichts bewertbar */
  ampel: Ampel | null
  vollstaendig: boolean
  kriterien: KriteriumErgebnis[]
  hinweise: string[]
}

const RANG: Record<Ampel, number> = { gruen: 0, gelb: 1, rot: 2 }

/**
 * Gesamt-Ampel eines Tests = die schlechteste der zählenden Kriterien
 * (Test ist grün, wenn Absolutwert und LSI erfüllt sind, sofern beide definiert).
 */
export function bewerteTest(
  test: TestDef,
  phase: PhaseId,
  eingaben: Record<string, Eingabe>,
  optionen: { geschlecht?: Geschlecht | ''; regeln?: Regeln } = {},
): TestErgebnis {
  const kriterien = test.kriterien.map((k) => bewerteKriterium(k, phase, eingaben[k.id], optionen))
  const zaehlende = kriterien.filter((e) => e.zaehlt && e.ampel)
  const ampel = zaehlende.reduce<Ampel | null>((schlecht, e) => (schlecht === null || RANG[e.ampel!] > RANG[schlecht] ? e.ampel! : schlecht), null)
  const relevant = kriterien.filter((e) => (e.kriterium.status === 'pflicht' || e.kriterium.status === 'wuenschenswert') && e.zustand !== 'nicht_anwendbar' && e.zustand !== 'info')
  const hinweise = [...new Set(kriterien.map((e) => e.hinweis).filter((h): h is string => !!h))]
  return { test, ampel, vollstaendig: relevant.every((e) => e.zustand === 'bewertet'), kriterien, hinweise }
}
