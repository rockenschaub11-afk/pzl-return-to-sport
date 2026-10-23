// Hilfsfunktion für modellierte Kurven: Stützpunkte [Zeit, Wert], weich verbunden.

export type Stuetzpunkte = readonly (readonly [number, number])[]

/** Wert zum Zeitpunkt t, weich interpoliert (Kosinus) zwischen den Stützpunkten. */
export function wertBei(punkte: Stuetzpunkte, t: number): number {
  if (t <= punkte[0][0]) return punkte[0][1]
  for (let i = 1; i < punkte.length; i++) {
    const [t1, f1] = punkte[i]
    if (t <= t1) {
      const [t0, f0] = punkte[i - 1]
      if (t1 === t0) return f1
      const anteil = (1 - Math.cos(((t - t0) / (t1 - t0)) * Math.PI)) / 2
      return f0 + (f1 - f0) * anteil
    }
  }
  return punkte[punkte.length - 1][1]
}
