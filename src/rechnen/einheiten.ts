// Einheiten-Umrechnung (docs/ENTSCHEIDUNGEN.md 3 und 6.2). Meloq und DynaMo zeigen Kraft in kg.

import regeln from '../../config/regeln.json'

export const G = regeln.erdbeschleunigung

/** kg (Anzeige am Gerät) → Newton */
export const kgZuN = (kg: number) => kg * G

/** Newton → kg */
export const nZuKg = (n: number) => n / G

/** Kraft relativ zum Körpergewicht: N/kg */
export const nProKg = (kraftN: number, koerpergewichtKg: number) => kraftN / koerpergewichtKg

/** Drehmoment relativ mit optionalem Hebelarm: Nm/kg */
export const nmProKg = (kraftN: number, hebelarmM: number, koerpergewichtKg: number) => (kraftN * hebelarmM) / koerpergewichtKg

/** Meloq Net Impulse (kg·s) → Ns/kg. Beispiel: 13,3 kg·s bei 59,15 kg → 2,21 Ns/kg */
export const nsProKg = (impulsKgS: number, koerpergewichtKg: number) => (impulsKgS * G) / koerpergewichtKg

/** Kraft in N – egal ob in kg oder N eingegeben. */
export const alsNewton = (wert: number, einheit: 'kg' | 'N') => (einheit === 'kg' ? kgZuN(wert) : wert)
