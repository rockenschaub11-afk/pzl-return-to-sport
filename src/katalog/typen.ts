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
  kriterien: Kriterium[]
}

export interface Protokoll {
  id: string
  name: string
  ablauf: string
  winkelGrad?: number
  boxhoeheCm?: number
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
