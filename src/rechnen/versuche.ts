// Versuche, Seitenvergleich und Streuung (docs/ENTSCHEIDUNGEN.md 3).

const gueltig = (werte: readonly (number | null | undefined)[]) =>
  werte.filter((w): w is number => typeof w === 'number' && Number.isFinite(w))

/** Bestwert der Versuche: größter Wert – bei Zeittests (6 m Hop) der kleinste. */
export function bestwert(versuche: readonly (number | null | undefined)[], zeitTest = false): number | null {
  const w = gueltig(versuche)
  if (w.length === 0) return null
  return zeitTest ? Math.min(...w) : Math.max(...w)
}

/**
 * Variationskoeffizient in % (Standardabweichung der Stichprobe / Mittelwert × 100).
 * Erst ab 2 Versuchen sinnvoll – sonst null.
 */
export function variationskoeffizient(versuche: readonly (number | null | undefined)[]): number | null {
  const w = gueltig(versuche)
  if (w.length < 2) return null
  const mittel = w.reduce((a, b) => a + b, 0) / w.length
  if (mittel === 0) return null
  const varianz = w.reduce((s, x) => s + (x - mittel) ** 2, 0) / (w.length - 1)
  return (Math.sqrt(varianz) / Math.abs(mittel)) * 100
}

/** „Messung wiederholen?“ – wenn die Versuche stärker streuen als erlaubt (Read: > 10 %). */
export function streuungZuHoch(versuche: readonly (number | null | undefined)[], grenzeProzent: number): boolean {
  const cv = variationskoeffizient(versuche)
  return cv !== null && cv > grenzeProzent
}

/**
 * LSI in % = betroffen / gesund × 100 – bei Zeittests gesund / betroffen × 100 (F22).
 * Auch für den Vergleich mit einem Vorverletzungswert: statt „gesund“ den Vorverletzungswert einsetzen.
 */
export function lsi(betroffen: number, gesund: number, zeitTest = false): number | null {
  const [oben, unten] = zeitTest ? [gesund, betroffen] : [betroffen, gesund]
  if (!Number.isFinite(oben) || !Number.isFinite(unten) || unten <= 0 || oben < 0) return null
  return (oben / unten) * 100
}

/** Asymmetrie wie Meloq: (stärker − schwächer) / stärker × 100 (ENTSCHEIDUNGEN 6.2). */
export function asymmetrie(links: number, rechts: number): number | null {
  const staerker = Math.max(links, rechts)
  if (!Number.isFinite(links) || !Number.isFinite(rechts) || staerker <= 0 || Math.min(links, rechts) < 0) return null
  return ((staerker - Math.min(links, rechts)) / staerker) * 100
}

/** Auf die angezeigten Nachkommastellen runden – die Ampel richtet sich nach dieser Zahl (Philipp, Etappe 3). */
export function gerundet(wert: number, nachkomma: number): number {
  const f = 10 ** nachkomma
  return Math.round(wert * f) / f
}
