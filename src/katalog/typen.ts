// Aufbau der Konfigurationsdateien in config/ (siehe dort die _info-Felder).

export const PHASEN_IDS = ['frueh', 'mitte', 'spaet', 'rtt', 'rtc'] as const
export type PhaseId = (typeof PHASEN_IDS)[number]

export const BLOECKE = ['klinik', 'hhd', 'platten', 'hops', 'kraftausdauer', 'prom'] as const
export type Block = (typeof BLOECKE)[number]

export const STATUS = ['pflicht', 'wuenschenswert', 'warnung', 'info'] as const
export type Status = (typeof STATUS)[number]

export const ARTEN = ['absolut', 'lsi', 'asymmetrie', 'auswahl', 'janein'] as const
export type KriteriumArt = (typeof ARTEN)[number]

export const VERGLEICHE = ['>', '>=', '<', '<='] as const
export type Vergleich = (typeof VERGLEICHE)[number]

export const MESSGERAETE = ['klinisch', 'dynamo', 'meloq', 'massband', 'stoppuhr', 'fragebogen'] as const
export type Messgeraet = (typeof MESSGERAETE)[number]

export interface Phase {
  id: PhaseId
  name: string
  lang: string
  vonMonat: number
  bisMonat: number | null
}

export interface Kriterium {
  id: string
  bezeichnung: string
  art: KriteriumArt
  vergleich?: Vergleich
  einheit?: string
  nachkomma?: number
  /** Schwelle je Phase oder 'alle'; leere Phase übernimmt den Wert davor */
  werte: Partial<Record<PhaseId | 'alle', number>>
  bereiche?: Partial<Record<PhaseId, [number, number]>>
  /** nur LSI: dreistufig (grün/gelb/rot) oder zweistufig (erfüllt/nicht erfüllt) */
  ampel?: 'dreistufig' | 'zweistufig'
  /** nur Auswahl */
  optionen?: string[]
  erlaubt?: string[]
  status: Status
  frauenWuenschenswert?: boolean
  quelle: string
  hinweis?: string
}

/** Wie ein Test erfasst und gerechnet wird – der Typ steht in tests.json, die Logik dazu im Code (erfassung.ts, TestKarte.tsx). Audit W5. */
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

export const ERFASSUNGS_TYPEN = ['auswahl', 'defizit', 'flexion', 'janein', 'kraft', 'cmj', 'sl_sprung', 'sl_dj', 'imtp', 'versuche', 'einzeln', 'direkt', 'score', 'koos'] as const satisfies readonly Erfassung['typ'][]

export interface TestDef {
  id: string
  name: string
  block: Block
  messgeraet: Messgeraet
  seitenvergleich: boolean
  zeitTest?: boolean
  inEndtestung: boolean
  optional?: boolean
  phasen: PhaseId[]
  protokoll?: string
  hinweise?: string[]
  /** Kurzinfo zum Test (i neben dem Namen), z. B. Ablauf und Stufen des Stroke-Tests */
  info?: { titel: string; zeilen: string[]; quelle: string }
  kriterien: Kriterium[]
  /** Erfassungstyp (fehlt = Test wird nicht erfasst) */
  erfassung?: Erfassung
}

export interface Protokoll {
  id: string
  name: string
  ablauf: string
  winkelGrad?: number
  boxhoeheCm?: number
  /** Standard, der bis zu einem Datum galt (Testungen davor ohne eingetragene Boxhöhe) */
  boxhoeheFrueher?: { cm: number; bisDatum: string }
  warum: string
  quelle: string
}

export interface Regeln {
  lsi: { gruenAb: number; gelbAb: number; quelle: string }
  variationskoeffizientWarnungUeber: number
  variationskoeffizientQuelle: string
  versucheJeSeite: number
  erdbeschleunigung: number
  hhdAbWochen: number
  hhdAbWochenQuelle: string
  frauenHinweis: string
  rts: { mindestMonate: number; freizeitEmpfehlungMonate: number; quelle: string }
}

export interface Katalog {
  phasen: Phase[]
  regeln: Regeln
  protokolle: Protokoll[]
  tests: TestDef[]
}

export const BLOCK_NAMEN: Record<Block, string> = {
  klinik: 'Klinik',
  hhd: 'Handdynamometer (HHD)',
  platten: 'Kraftmessplatten',
  hops: 'Hops (Maßband/Stoppuhr)',
  kraftausdauer: 'Kraftausdauer',
  prom: 'Fragebögen (PROM)',
}

export const STATUS_NAMEN: Record<Status, string> = {
  pflicht: 'Pflicht',
  wuenschenswert: 'wünschenswert',
  warnung: 'Warnung',
  info: 'Info',
}
