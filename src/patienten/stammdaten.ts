// Stammdaten je Kürzel (docs/ENTSCHEIDUNGEN.md, Abschnitt 2).
// Körpergewicht wird je Testung erfasst (Etappe 4), nicht hier.

export type Seite = 'links' | 'rechts'
export type Niveau = 'wettkampf' | 'freizeit'
export type Geschlecht = 'weiblich' | 'maennlich' | 'divers'
export type Graft = 'bptb' | 'hamstring' | 'quadrizeps' | 'andere'
export type BegleitOp = 'meniskus' | 'knorpel' | 'let' | 'seitenband'

export interface Stammdaten {
  kuerzel: string
  seite: Seite | ''
  opDatum: string // ISO-Datum JJJJ-MM-TT
  niveau: Niveau | ''
  geschlecht: Geschlecht | ''
  geburtsjahr: string
  beinlaengeCm: string
  graft: Graft | ''
  begleitOps: BegleitOp[]
  begleitOpAndere: string
  revision: boolean
  konservativ: boolean
  sportart: string
  tegner: string
}

export interface Patient extends Stammdaten {
  id: string
  kuerzelNorm: string
  angelegtAm: string
  geaendertAm: string
}

export const LEER: Stammdaten = {
  kuerzel: '',
  seite: '',
  opDatum: '',
  niveau: '',
  geschlecht: '',
  geburtsjahr: '',
  beinlaengeCm: '',
  graft: '',
  begleitOps: [],
  begleitOpAndere: '',
  revision: false,
  konservativ: false,
  sportart: '',
  tegner: '',
}

export const SEITEN: Record<Seite, string> = { links: 'Links', rechts: 'Rechts' }
export const NIVEAUS: Record<Niveau, string> = { wettkampf: 'Wettkampf', freizeit: 'Freizeit' }
export const GESCHLECHTER: Record<Geschlecht, string> = {
  weiblich: 'weiblich',
  maennlich: 'männlich',
  divers: 'divers',
}
export const GRAFTS: Record<Graft, string> = {
  bptb: 'BPTB (Patellarsehne)',
  hamstring: 'Hamstring (ST/G)',
  quadrizeps: 'Quadrizepssehne',
  andere: 'andere/unbekannt',
}
export const BEGLEIT_OPS: Record<BegleitOp, string> = {
  meniskus: 'Meniskus',
  knorpel: 'Knorpel',
  let: 'LET',
  seitenband: 'Seitenband',
}

export const KUERZEL_MAX = 15

/** Großbuchstaben, ohne Leerzeichen – so werden „mh-1998“ und „MH-1998 “ als gleich erkannt. */
export function normalisiereKuerzel(kuerzel: string): string {
  return kuerzel.trim().toUpperCase().replace(/\s+/g, '')
}

/** Vorschlag „Initialen-Geburtsjahr“, z. B. MH + 1998 → MH-1998. */
export function kuerzelVorschlag(initialen: string, geburtsjahr: string): string | null {
  const ini = normalisiereKuerzel(initialen)
  if (!/^[A-ZÄÖÜ]{1,3}$/.test(ini) || !/^\d{4}$/.test(geburtsjahr.trim())) return null
  return `${ini}-${geburtsjahr.trim()}`
}

/** Nächstes freies Kürzel, z. B. MH-1998 → MH-1998-2, wenn MH-1998 schon vergeben ist. */
export function freiesKuerzel(kuerzel: string, vergeben: Iterable<string>): string {
  const belegt = new Set([...vergeben].map(normalisiereKuerzel))
  const basis = normalisiereKuerzel(kuerzel)
  if (!belegt.has(basis)) return basis
  let n = 2
  while (belegt.has(`${basis}-${n}`)) n++
  return `${basis}-${n}`
}

export type Fehler = Partial<Record<keyof Stammdaten, string>>

export function pruefe(daten: Stammdaten, heute: Date = new Date()): Fehler {
  const f: Fehler = {}
  const kuerzel = normalisiereKuerzel(daten.kuerzel)
  const jahr = heute.getFullYear()

  if (!kuerzel) f.kuerzel = 'Bitte ein Kürzel eingeben, z. B. MH-1998.'
  else if (kuerzel.length > KUERZEL_MAX) f.kuerzel = `Höchstens ${KUERZEL_MAX} Zeichen – bitte nur ein Kürzel, keinen Namen.`
  else if (!/^[A-ZÄÖÜ0-9-]+$/.test(kuerzel)) f.kuerzel = 'Nur Buchstaben, Ziffern und Bindestrich.'

  if (!daten.seite) f.seite = 'Bitte die betroffene Seite wählen.'
  if (!daten.niveau) f.niveau = 'Bitte Wettkampf oder Freizeit wählen.'

  if (!daten.opDatum) f.opDatum = daten.konservativ ? 'Bitte das Verletzungsdatum eingeben.' : 'Bitte das OP-Datum eingeben.'
  else if (Number.isNaN(Date.parse(daten.opDatum))) f.opDatum = 'Ungültiges Datum.'
  else if (daten.opDatum > isoDatum(heute)) f.opDatum = 'Das Datum liegt in der Zukunft.'

  if (daten.geburtsjahr) {
    const j = Number(daten.geburtsjahr)
    if (!Number.isInteger(j) || j < jahr - 100 || j > jahr - 5) f.geburtsjahr = `Bitte ein Jahr zwischen ${jahr - 100} und ${jahr - 5}.`
  }
  if (daten.beinlaengeCm) {
    const b = Number(daten.beinlaengeCm.replace(',', '.'))
    if (!Number.isFinite(b) || b < 50 || b > 130) f.beinlaengeCm = 'Bitte einen Wert zwischen 50 und 130 cm.'
  }
  if (daten.tegner) {
    const t = Number(daten.tegner)
    if (!Number.isInteger(t) || t < 0 || t > 10) f.tegner = 'Tegner-Score von 0 bis 10.'
  }
  return f
}

export function isoDatum(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** „12.03.2026“ */
export function datumDeutsch(iso: string): string {
  const [j, m, t] = iso.split('-')
  return j && m && t ? `${t}.${m}.${j}` : iso
}

/** Volle Monate seit dem Datum (nur Anzeige in der Liste). */
export function monateSeit(iso: string, heute: Date = new Date()): number | null {
  const [j, m, t] = iso.split('-').map(Number)
  if (!j || !m || !t) return null
  let monate = (heute.getFullYear() - j) * 12 + (heute.getMonth() + 1 - m)
  if (heute.getDate() < t) monate--
  return Math.max(0, monate)
}

/** Suche über Kürzel und Sportart, Groß-/Kleinschreibung egal. */
export function passtZurSuche(p: Pick<Stammdaten, 'kuerzel' | 'sportart'>, suche: string): boolean {
  const s = suche.trim().toLowerCase()
  if (!s) return true
  return p.kuerzel.toLowerCase().includes(s) || p.sportart.toLowerCase().includes(s)
}
