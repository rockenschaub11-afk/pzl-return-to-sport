// Nachvollziehbarkeit im Arztbericht (Bericht-Audit Paket B):
// Protokoll je Test (Punkt 5), Richtung der Asymmetrie (Punkt 6), Rohdaten mit Streuung (Punkt 9).
// Nichts davon ändert eine Rechnung oder Ampel – es macht nur sichtbar, was gespeichert ist.

import { KATALOG, protokollNach } from '../katalog'
import type { TestDef } from '../katalog/typen'
import type { Seite } from '../patienten/stammdaten'
import { bestwert, variationskoeffizient } from '../rechnen/versuche'
import { ERFASSUNG, parseZahl, VERSUCHE, type Berechnung, type TestEingabe } from '../testung/erfassung'

const zahl = (v: number, nachkomma = 1) => v.toLocaleString('de-AT', { maximumFractionDigits: nachkomma })

// ---------- Protokoll (Punkt 5) ----------

export interface ProtokollTeil {
  text: string
  /** tatsächlicher Wert weicht vom Standard-Protokoll ab */
  abweichend: boolean
}

function tatsaechlich(name: string, eingabe: string | undefined, standard: number, einheit: string): ProtokollTeil {
  const w = parseZahl(eingabe)
  if (w === null) return { text: `${name} ${zahl(standard)}${einheit} (Standard)`, abweichend: false }
  if (w === standard) return { text: `${name} ${zahl(w)}${einheit}`, abweichend: false }
  return { text: `${name} ${zahl(w)}${einheit} – Standard ${zahl(standard)}${einheit}`, abweichend: true }
}

/** Messrelevante Angaben eines Tests: Winkel, Boxhöhe, Eingabe-Einheit, Hebelarm. Leer, wenn es nichts gibt. */
export function protokollTeile(test: TestDef, e: TestEingabe): ProtokollTeil[] {
  const p = test.protokoll ? protokollNach(test.protokoll) : undefined
  const teile: ProtokollTeil[] = []
  if (p?.winkelGrad !== undefined) teile.push(tatsaechlich('Winkel', e.winkel, p.winkelGrad, '°'))
  if (p?.boxhoeheCm !== undefined) teile.push(tatsaechlich('Box', e.box, p.boxhoeheCm, ' cm'))
  const typ = ERFASSUNG[test.id]?.typ
  if (typ === 'kraft' || typ === 'imtp') teile.push({ text: `Eingabe in ${e.einheit === 'N' ? 'N' : 'kg'}`, abweichend: false })
  const hebel = parseZahl(e.hebel)
  if (hebel) teile.push({ text: `Hebelarm ${zahl(hebel, 2)} m`, abweichend: false })
  return teile
}

// ---------- Richtung der Asymmetrie (Punkt 6) ----------

export type Richtung = 'schwaecher' | 'staerker' | 'gleich'

export const RICHTUNG_ARZT: Record<Richtung, string> = {
  schwaecher: 'betroffene Seite schwächer',
  staerker: 'betroffene Seite stärker',
  gleich: 'beide Seiten gleich',
}

export const RICHTUNG_PAT: Record<Richtung, string> = {
  schwaecher: 'betroffenes Bein schwächer',
  staerker: 'betroffenes Bein stärker',
  gleich: 'beide Beine gleich',
}

export function richtung(betroffen: number | null, gesund: number | null): Richtung | null {
  if (betroffen === null || gesund === null) return null
  if (betroffen === gesund) return 'gleich'
  return betroffen < gesund ? 'schwaecher' : 'staerker'
}

/** Links/rechts-Werte (CMJ, Meloq) der betroffenen bzw. gesunden Seite zuordnen. */
export function nachSeite<T>(links: T, rechts: T, seite: Seite | ''): { betroffen: T; gesund: T } | null {
  if (seite === 'links') return { betroffen: links, gesund: rechts }
  if (seite === 'rechts') return { betroffen: rechts, gesund: links }
  return null
}

/** Welche Seite hat beim gewerteten Versuch den kleineren Net Impulse? (CMJ: L/R nach betroffener Seite, SL-CMJ: gesund/betroffen) */
export function impulsRichtung(test: TestDef, e: TestEingabe, b: Berechnung, seite: Seite | ''): Richtung | null {
  if (test.id === 'cmj') {
    const n = b.besterVersuch.gesamt
    const s = n ? nachSeite(parseZahl(e[`v${n}_impL`]), parseZahl(e[`v${n}_impR`]), seite) : null
    return s ? richtung(s.betroffen, s.gesund) : null
  }
  if (test.id === 'sl_cmj') {
    const ng = b.besterVersuch.gesund
    const nb = b.besterVersuch.betroffen
    return richtung(nb ? parseZahl(e[`b${nb}_imp`]) : null, ng ? parseZahl(e[`g${ng}_imp`]) : null)
  }
  return null
}

// ---------- Rohdaten mit Streuung (Punkt 9) ----------

export interface RohZeile {
  seite: 'gesund' | 'betroffen' | 'beidbeinig'
  /** Versuch 1–3 (null = leer) */
  werte: (number | null)[]
  /** Index des gewerteten Versuchs (Bestwert bzw. größte Sprunghöhe) */
  gewertet: number | null
  /** Variationskoeffizient in % (ab 2 Versuchen) */
  cv: number | null
  cvHoch: boolean
}

export interface RohTest {
  id: string
  name: string
  einheit: string
  /** was gewertet wird, z. B. „Bestwert“ */
  gewertet: string
  zeilen: RohZeile[]
}

const GRENZE = () => KATALOG.regeln.variationskoeffizientWarnungUeber

function zeile(seite: RohZeile['seite'], werte: (number | null)[], gewertet: number | null): RohZeile {
  const cv = variationskoeffizient(werte)
  return { seite, werte, gewertet, cv, cvHoch: cv !== null && cv > GRENZE() }
}

function bestIndex(werte: (number | null)[], zeitTest: boolean): number | null {
  const best = bestwert(werte, zeitTest)
  const i = best === null ? -1 : werte.indexOf(best)
  return i < 0 ? null : i
}

const versuche = (e: TestEingabe, praefix: string, feld?: string) => VERSUCHE.map((n) => parseZahl(e[`${praefix}${n}${feld ? `_${feld}` : ''}`]))
const nr = (n: number | undefined) => (n ? n - 1 : null)

/** Einzelversuche eines Tests – null für Tests ohne Versuche (Klinik, Kraftausdauer, Fragebögen …) oder ohne Eingabe. */
export function rohdaten(test: TestDef, e: TestEingabe, b: Berechnung): RohTest | null {
  const art = ERFASSUNG[test.id]
  const zeitTest = !!test.zeitTest
  let einheit = ''
  let gewertet = 'Bestwert'
  let zeilen: RohZeile[] = []
  switch (art?.typ) {
    case 'kraft':
    case 'versuche': {
      einheit = art.typ === 'kraft' ? (e.einheit === 'N' ? 'N' : 'kg') : art.einheit
      if (zeitTest) gewertet = 'schnellster Versuch'
      const g = versuche(e, 'g')
      const bb = versuche(e, 'b')
      zeilen = [zeile('gesund', g, bestIndex(g, zeitTest)), zeile('betroffen', bb, bestIndex(bb, zeitTest))]
      break
    }
    case 'imtp': {
      einheit = e.einheit === 'N' ? 'N' : 'kg'
      const v = versuche(e, 'v')
      zeilen = [zeile('beidbeinig', v, bestIndex(v, false))]
      break
    }
    case 'cmj':
      einheit = 'cm'
      gewertet = 'größte Sprunghöhe'
      zeilen = [zeile('beidbeinig', versuche(e, 'v', 'hoehe'), nr(b.besterVersuch.gesamt))]
      break
    case 'sl_sprung':
    case 'sl_dj':
      einheit = 'cm'
      gewertet = 'größte Sprunghöhe'
      zeilen = [zeile('gesund', versuche(e, 'g', 'hoehe'), nr(b.besterVersuch.gesund)), zeile('betroffen', versuche(e, 'b', 'hoehe'), nr(b.besterVersuch.betroffen))]
      break
    default:
      return null
  }
  zeilen = zeilen.filter((z) => z.werte.some((w) => w !== null))
  return zeilen.length > 0 ? { id: test.id, name: test.name, einheit, gewertet, zeilen } : null
}

/** Hinweis bei zu großer Streuung – statt „Messung ggf. wiederholt“ (Punkt 9). */
export function streuungHinweis(seite: string, cv: number): string {
  return `Streuung ${seite}: CV ${zahl(cv)} % (> ${GRENZE()} %, ${KATALOG.regeln.variationskoeffizientQuelle}) – mit Vorsicht interpretieren`
}
