// Kern-Satz-Strategy-Werte und frei wählbare Meloq-Metriken (ENTSCHEIDUNGEN 6.4, Etappe-5-Fragen).
// Ohne Ampel – mit LSI (einbeinig) bzw. Asymmetrie (CMJ links/rechts).

import { zusatzFuer, type MeloqTest, type Ods, type ZusatzMetrik } from '../katalog/meloq'
import { G } from '../rechnen/einheiten'
import { asymmetrie, lsi } from '../rechnen/versuche'
import { parseZahl, type Berechnung, type TestEingabe } from './erfassung'

export interface MeloqZeile {
  id: string
  name: string
  ods: Ods
  einheit: string
  hinweis?: string
  /** eins = ein Wert; lr = links/rechts (CMJ); gb = gesund/betroffen (einbeinig) */
  form: 'eins' | 'lr' | 'gb'
  /** Eingabe-Felder in der Reihenfolge der Werte (leer bei Kern-Werten aus der Versuchstabelle) */
  felder: string[]
  werte: (number | null)[]
  relativ?: { einheit: string; werte: (number | null)[] }
  vergleich?: { art: 'asymmetrie' | 'lsi'; wert: number | null }
}

/** Meloq-Wert → relativ: kg → N/kg, W → W/kg, kg/s → N/s */
export function relativWert(wert: number | null, art: ZusatzMetrik['relativ'], kg: number | null): number | null {
  if (wert === null || !art) return null
  if (art === 'N/s') return wert * G
  if (!kg || kg <= 0) return null
  return art === 'N/kg' ? (wert * G) / kg : wert / kg
}

function vergleich(form: MeloqZeile['form'], werte: (number | null)[]): MeloqZeile['vergleich'] {
  const [a, b] = werte
  if (form === 'lr') return { art: 'asymmetrie', wert: a !== null && b !== null ? asymmetrie(a, b) : null }
  if (form === 'gb') return { art: 'lsi', wert: a !== null && b !== null ? lsi(b, a) : null }
  return undefined
}

/** Strategy-Wert des Kern-Satzes (Contraction Time bzw. Kontaktzeit) aus dem gewerteten Versuch. */
export function kernStrategie(test: MeloqTest, e: TestEingabe, b: Berechnung): MeloqZeile {
  if (test === 'cmj') {
    const n = b.besterVersuch.gesamt
    const werte = [n ? parseZahl(e[`v${n}_ct`]) : null]
    return { id: 'ct', name: 'Contraction Time', ods: 'strategy', einheit: 'ms', form: 'eins', felder: [], werte }
  }
  const feld = test === 'sl_dj' ? 'kz' : 'ct'
  const g = b.besterVersuch.gesund
  const bb = b.besterVersuch.betroffen
  const werte = [g ? parseZahl(e[`g${g}_${feld}`]) : null, bb ? parseZahl(e[`b${bb}_${feld}`]) : null]
  return {
    id: feld,
    name: test === 'sl_dj' ? 'Kontaktzeit' : 'Contraction Time',
    ods: 'strategy',
    einheit: 'ms',
    form: 'gb',
    felder: [],
    werte,
    vergleich: vergleich('gb', werte),
  }
}

/** Gewählte Zusatzmetriken mit Eingabefeldern, Relativwert und Seitenvergleich. */
export function zusatzZeilen(test: MeloqTest, e: TestEingabe, auswahl: readonly string[], kg: number | null): MeloqZeile[] {
  return zusatzFuer(test)
    .filter((m) => auswahl.includes(m.id))
    .map((m) => {
      const form: MeloqZeile['form'] = test === 'cmj' ? (m.seitig ? 'lr' : 'eins') : 'gb'
      const felder = form === 'lr' ? [`z_${m.id}_l`, `z_${m.id}_r`] : form === 'gb' ? [`z_${m.id}_g`, `z_${m.id}_b`] : [`z_${m.id}`]
      const werte = felder.map((f) => parseZahl(e[f]))
      return {
        id: m.id,
        name: m.name,
        ods: m.ods,
        einheit: m.einheit,
        hinweis: m.hinweis,
        form,
        felder,
        werte,
        relativ: m.relativ ? { einheit: m.relativ, werte: werte.map((w) => relativWert(w, m.relativ, kg)) } : undefined,
        vergleich: vergleich(form, werte),
      }
    })
}
