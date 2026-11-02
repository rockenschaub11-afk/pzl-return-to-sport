// Status einer Testkarte (UI-Audit Punkte 2–4): nur die Anzeige im Kartenkopf und in der Übersicht.
// Die Ampel je Kriterium, der RTS-Vorschlag und die Berichte bleiben unverändert.

import type { Ampel, KriteriumErgebnis, TestErgebnis } from '../rechnen/bewertung'
import { AMPEL_TEXT } from './Ladebalken'

export interface KartenStatus {
  /** null = neutrale Marke (offen, erfasst, nur wünschenswert verfehlt) */
  ampel: Ampel | null
  text: string
  /** Pflicht passt, aber ein wünschenswertes Kriterium ist nicht erreicht – blockiert nicht */
  wuenschenswertOffen: boolean
  /** vollständig und ohne Auffälligkeit – die Karte darf beim Öffnen der Testung zugeklappt sein */
  ruhig: boolean
}

const RANG: Record<Ampel, number> = { gruen: 0, gelb: 1, rot: 2 }
const ZEICHEN: Record<Ampel, string> = { gruen: '✓', gelb: '~', rot: '✗' }

const schlechteste = (liste: KriteriumErgebnis[]): Ampel | null =>
  liste.reduce<Ampel | null>((x, e) => (e.ampel && (!x || RANG[e.ampel] > RANG[x]) ? e.ampel : x), null)

export function kartenStatus(e: TestErgebnis, gemessen: boolean): KartenStatus {
  const anwendbar = e.kriterien.filter((k) => k.zustand !== 'nicht_anwendbar')
  const bewertet = anwendbar.filter((k) => k.zustand === 'bewertet' && k.ampel)
  const vonStatus = (s: string) => bewertet.filter((k) => k.kriterium.status === s)
  const wunsch = schlechteste(vonStatus('wuenschenswert'))
  const wuenschenswertOffen = wunsch !== null && wunsch !== 'gruen'
  const offen: KartenStatus = { ampel: null, text: 'offen', wuenschenswertOffen: false, ruhig: false }
  if (!gemessen) return offen

  const hatPflicht = anwendbar.some((k) => k.kriterium.status === 'pflicht')
  if (hatPflicht) {
    const ampel = schlechteste(vonStatus('pflicht'))
    if (!ampel) return offen
    const text = `${AMPEL_TEXT[ampel]}${e.vollstaendig ? '' : ' (unvollständig)'}`
    return { ampel, text, wuenschenswertOffen, ruhig: ampel === 'gruen' && e.vollstaendig && !wuenschenswertOffen }
  }

  const warnung = schlechteste(vonStatus('warnung'))
  if (warnung && warnung !== 'gruen') return { ampel: 'gelb', text: 'Warnung', wuenschenswertOffen: false, ruhig: false }
  if (wuenschenswertOffen) return { ampel: null, text: `${ZEICHEN[wunsch!]} wünschenswert`, wuenschenswertOffen: false, ruhig: false }
  if (wunsch === 'gruen') return { ampel: 'gruen', text: `${AMPEL_TEXT.gruen}${e.vollstaendig ? '' : ' (unvollständig)'}`, wuenschenswertOffen: false, ruhig: e.vollstaendig }
  return { ampel: null, text: 'erfasst', wuenschenswertOffen: false, ruhig: true }
}
