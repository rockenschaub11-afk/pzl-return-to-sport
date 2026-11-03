// Feldnamen der Eingaben an einer Stelle (Audit L4) – statt zusammengesetzter Zeichenketten in Rechnung, Testkarte und Bericht.
// Gespeichert wird genau wie bisher (z. B. „g1“, „b2_hoehe“, „z_peak_force_l“) – bestehende Testungen und Sicherungen bleiben lesbar.

/** g = gesund, b = betroffen, v = beidbeinig (CMJ, IMTP) */
export type Reihe = 'g' | 'b' | 'v'

/** Wert eines Versuchs, z. B. versuch('g', 1) → „g1“, versuch('b', 2, 'hoehe') → „b2_hoehe“ */
export const versuchFeld = (reihe: Reihe, n: number, wert?: string) => `${reihe}${n}${wert ? `_${wert}` : ''}`

/** KOOS-Subskala, z. B. „koos_schmerz“ */
export const koosFeld = (subskala: string) => `koos_${subskala}`

/** Meloq-Zusatzwert, z. B. meloqFeld('peak_force', 'l') → „z_peak_force_l“; ohne Seite → „z_flugzeit“ */
export const meloqFeld = (metrik: string, seite?: 'l' | 'r' | 'g' | 'b') => `z_${metrik}${seite ? `_${seite}` : ''}`
