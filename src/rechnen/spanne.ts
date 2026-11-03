// Spanne der Einzelversuche für die Diagramme (Visualisierung Stufe 1).
// Ändert keine Bewertung: Ampel und LSI kommen weiter aus dem Bestwert – die Spanne zeigt nur, wie weit die Versuche auseinanderliegen.

import { lsi } from './versuche'

const gueltig = (werte: readonly (number | null | undefined)[]) => werte.filter((w): w is number => typeof w === 'number' && Number.isFinite(w))

/** Kleinster und größter Versuch – null, wenn es weniger als 2 Versuche gibt. */
export function spanne(werte: readonly (number | null | undefined)[]): [number, number] | null {
  const w = gueltig(werte)
  if (w.length < 2) return null
  return [Math.min(...w), Math.max(...w)]
}

/**
 * LSI-Spanne aus allen Kombinationen der Versuche (jeder Versuch betroffen gegen jeden Versuch gesund).
 * null, wenn keine Seite mindestens 2 Versuche hat – dann gibt es keine Spanne, nur den Punkt.
 */
export function lsiSpanne(gesund: readonly (number | null | undefined)[], betroffen: readonly (number | null | undefined)[], zeitTest = false): [number, number] | null {
  const g = gueltig(gesund)
  const b = gueltig(betroffen)
  if (g.length === 0 || b.length === 0 || (g.length < 2 && b.length < 2)) return null
  const werte = b.flatMap((x) => g.map((y) => lsi(x, y, zeitTest))).filter((v): v is number => v !== null)
  if (werte.length === 0) return null
  return [Math.min(...werte), Math.max(...werte)]
}
