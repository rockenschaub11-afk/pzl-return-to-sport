// ODS-Seitenvergleich je einbeinigem Sprungtest (Visualisierung Stufe 1, Konzept C2):
// Output, Driver und Strategy nebeneinander – gleiche Sprunghöhe kann mit weniger Antrieb oder längerer Ausholbewegung entstehen.
// Nur gemessene Werte aus dem gewerteten Versuch (größte Sprunghöhe); Ampel nur dort, wo der Katalog ein Ziel hat (Sprunghöhe-LSI).

import type { Testung } from '../db'
import { testNach } from '../katalog'
import { MELOQ, ODS_REIHENFOLGE, type Ods } from '../katalog/meloq'
import type { Ampel, TestErgebnis } from '../rechnen/bewertung'
import { nsProKg } from '../rechnen/einheiten'
import { lsi } from '../rechnen/versuche'
import { parseZahl, type Berechnung } from '../testung/erfassung'
import { kernStrategie, zusatzZeilen } from '../testung/meloq'
import { phasenStand, werteAus } from '../testung/ablauf'
import type { Patient } from '../patienten/stammdaten'

export const ODS_TESTS = ['sl_cmj', 'sl_dj'] as const
export type OdsTest = (typeof ODS_TESTS)[number]

export interface OdsZeile {
  id: string
  ods: Ods
  name: string
  einheit: string
  gesund: number | null
  betroffen: number | null
  /** betroffen / gesund × 100 */
  lsi: number | null
  /** Zeit der Strategie (Contraction Time, Kontaktzeit): über 100 % heißt „betroffen braucht länger“ */
  zeit: boolean
  ampel: Ampel | null
  ziel: number | null
  nachkomma: number
}

export interface OdsVergleich {
  test: OdsTest
  name: string
  zeilen: OdsZeile[]
}

const vergleiche = (g: number | null, b: number | null) => (g !== null && b !== null ? lsi(b, g) : null)

/** Zeilen eines Tests in ODS-Reihenfolge; nur Zeilen mit beiden Seiten. */
export function odsZeilen(test: OdsTest, testung: Pick<Testung, 'eingaben' | 'koerpergewichtKg'>, b: Berechnung, ergebnis: TestErgebnis | undefined): OdsZeile[] {
  const e = testung.eingaben[test] ?? {}
  const kg = parseZahl(testung.koerpergewichtKg)
  const ng = b.besterVersuch.gesund
  const nb = b.besterVersuch.betroffen
  const ausVersuch = (feld: string): [number | null, number | null] => [ng ? parseZahl(e[`g${ng}_${feld}`]) : null, nb ? parseZahl(e[`b${nb}_${feld}`]) : null]
  const kLsi = ergebnis?.kriterien.find((k) => k.kriterium.id === 'lsi' && k.zustand === 'bewertet')

  const zeilen: OdsZeile[] = []
  const neu = (z: Omit<OdsZeile, 'lsi' | 'zeit' | 'ampel' | 'ziel' | 'nachkomma'> & Partial<Pick<OdsZeile, 'zeit' | 'ampel' | 'ziel' | 'nachkomma'>>) =>
    zeilen.push({ zeit: false, ampel: null, ziel: null, nachkomma: 1, ...z, lsi: vergleiche(z.gesund, z.betroffen) })

  neu({
    id: 'hoehe',
    ods: 'output',
    name: 'Sprunghöhe',
    einheit: 'cm',
    gesund: b.seiten?.gesund ?? null,
    betroffen: b.seiten?.betroffen ?? null,
    ampel: kLsi?.ampel ?? null,
    ziel: kLsi?.schwelle?.wert ?? null,
  })
  if (test === 'sl_dj') {
    const [g, bb] = ausVersuch('rsi')
    neu({ id: 'rsi', ods: 'output', name: 'RSI', einheit: '', gesund: g, betroffen: bb, nachkomma: 2 })
  } else {
    const [g, bb] = ausVersuch('imp')
    const rel = (v: number | null) => (v === null || !kg ? v : nsProKg(v, kg))
    neu({ id: 'net_impulse', ods: 'driver', name: 'Net Impulse', einheit: kg ? 'Ns/kg' : 'kg·s', gesund: rel(g), betroffen: rel(bb), nachkomma: 2 })
  }
  const k = kernStrategie(test, e, b)
  neu({ id: k.id, ods: 'strategy', name: k.name, einheit: 'ms', gesund: k.werte[0], betroffen: k.werte[1], zeit: true, nachkomma: 0 })

  // frei gewählte Meloq-Werte, sofern eingetragen (Zeiten außerhalb der Strategie, z. B. Flugzeit, sind Output: länger = besser)
  for (const z of zusatzZeilen(test, e, MELOQ.zusatz.map((m) => m.id), kg)) {
    const w = z.relativ && z.relativ.werte.some((x) => x !== null) ? z.relativ : z
    neu({ id: z.id, ods: z.ods, name: z.name, einheit: w.einheit, gesund: w.werte[0], betroffen: w.werte[1], zeit: z.ods === 'strategy' && z.einheit === 'ms', nachkomma: w.einheit === 'N/s' || z.einheit === 'ms' ? 0 : 1 })
  }

  return zeilen.filter((z) => z.lsi !== null).sort((a, c) => ODS_REIHENFOLGE.indexOf(a.ods) - ODS_REIHENFOLGE.indexOf(c.ods))
}

/** ODS-Vergleiche einer Testung – nur Tests mit mindestens zwei ODS-Gruppen (sonst gibt es nichts gegenüberzustellen). */
export function odsVergleiche(
  testung: Pick<Testung, 'eingaben' | 'koerpergewichtKg'>,
  auswertung: Map<string, { berechnung: Berechnung; ergebnis: TestErgebnis }>,
  namen: Record<string, string>,
): OdsVergleich[] {
  return ODS_TESTS.flatMap((test) => {
    const a = auswertung.get(test)
    if (!a) return []
    const zeilen = odsZeilen(test, testung, a.berechnung, a.ergebnis)
    return new Set(zeilen.map((z) => z.ods)).size >= 2 ? [{ test, name: namen[test] ?? test, zeilen }] : []
  })
}

/** ODS-Vergleiche einer Testung mit den Schwellen ihrer Phase (wie in Testkarte und Bericht). */
export function odsFuerTestung(patient: Pick<Patient, 'opDatum' | 'geschlecht'>, testung: Testung): OdsVergleich[] {
  const phase = phasenStand(testung, patient.opDatum).phase
  const namen = Object.fromEntries(ODS_TESTS.map((t) => [t, testNach(t)?.name ?? t]))
  return odsVergleiche(testung, werteAus(testung, phase, patient.geschlecht), namen)
}
