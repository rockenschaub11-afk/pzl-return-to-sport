// Live-Monitor der Startseite (docs/ENTSCHEIDUNGEN.md 10a, Startseite).
// Modellierte Kurven, rein dekorativ – keine Messdaten, keine Pat.-Daten.
// Werte sind auf das Körpergewicht bezogen (1 = ruhiger Stand); Zeiten in Sekunden.

import { wertBei, type Stuetzpunkte } from './kurven'

export type Zufall = () => number
export type KanalArt = 'cmj' | 'ext' | 'dj'

/** Wiederholbarer Zufall (mulberry32) – für Tests. */
export function zufallMitSamen(samen: number): Zufall {
  let a = samen >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const zwischen = (z: Zufall, von: number, bis: number) => von + (bis - von) * z()

export interface Ereignis {
  start: number
  dauer: number
  /** je Linie eine Kurve; Zeiten relativ zum Start */
  linien: Stuetzpunkte[]
}

export interface Kanal {
  art: KanalArt
  /** Wert jeder Linie, wenn gerade nichts passiert */
  ruhe: number[]
  /** höchster Wert, der im Band Platz haben muss */
  max: number
  pause: [number, number]
  ereignisse: Ereignis[]
  naechstes: number
}

/** CMJ je Seite: Stand → Entlastung → Bremsen → Abdruck → Flug → Landung → Stand */
function cmjSeite(peak: number, flug: number, landung: number): Stuetzpunkte {
  const ab = 0.73
  const lande = ab + flug
  return [
    [0, 1], [0.17, 0.45], [0.3, 0.78], [0.43, 0.92 * peak], [0.51, peak], [0.61, 0.9 * peak], [0.7, 0.25], [0.72, 0.04], [ab, 0],
    [lande, 0], [lande + 0.04, landung], [lande + 0.1, 2.1], [lande + 0.18, 1.3], [lande + 0.38, 1],
  ]
}

export function erzeugeEreignis(art: KanalArt, start: number, z: Zufall): Ereignis {
  switch (art) {
    case 'cmj': {
      const flug = Math.sqrt((8 * zwischen(z, 0.28, 0.38)) / 9.81)
      const peak = zwischen(z, 2.2, 2.6)
      const asym = zwischen(z, 0, 0.12)
      const links = cmjSeite(peak, flug, 4.2)
      const rechts = cmjSeite(peak * (1 - asym), flug, 4.2 * (1 - asym))
      return { start, dauer: links[links.length - 1][0], linien: [links, rechts] }
    }
    case 'ext': {
      // isometrische Knie-Extension: Anstieg → Peak → halten → loslassen
      const peak = zwischen(z, 0.75, 1)
      const bisPeak = zwischen(z, 0.35, 0.7)
      const halten = zwischen(z, 2, 3)
      const punkte: Stuetzpunkte = [
        [0, 0], [bisPeak * 0.45, 0.6 * peak], [bisPeak * 0.8, 0.95 * peak], [bisPeak, peak],
        [bisPeak + halten * 0.5, 0.97 * peak], [bisPeak + halten, 0.92 * peak], [bisPeak + halten + 0.3, 0.3 * peak], [bisPeak + halten + 0.5, 0],
      ]
      return { start, dauer: punkte[punkte.length - 1][0], linien: [punkte] }
    }
    case 'dj': {
      // einbeiniger Drop Jump: Landung von der Box → kurzer Kontakt → Flug → Landung → Stand → Abgang von der Platte
      const kontakt = zwischen(z, 0.24, 0.38)
      const flug = Math.sqrt((8 * zwischen(z, 0.12, 0.2)) / 9.81)
      const ab = kontakt
      const lande = ab + flug
      const punkte: Stuetzpunkte = [
        [0, 0], [0.03, zwischen(z, 3, 3.6)], [0.08, 2.2], [kontakt * 0.55, 2.6], [ab - 0.03, 0.4], [ab - 0.01, 0.04], [ab, 0],
        [lande, 0], [lande + 0.03, 4], [lande + 0.1, 1.8], [lande + 0.25, 1.1], [lande + 0.45, 1], [lande + 0.9, 1], [lande + 1.1, 0],
      ]
      return { start, dauer: punkte[punkte.length - 1][0], linien: [punkte] }
    }
  }
}

export function neuerKanal(art: KanalArt): Kanal {
  switch (art) {
    case 'cmj':
      return { art, ruhe: [1, 1], max: 4.5, pause: [0.6, 2.2], ereignisse: [], naechstes: 0 }
    case 'ext':
      return { art, ruhe: [0], max: 1.1, pause: [0.8, 2.5], ereignisse: [], naechstes: 0 }
    case 'dj':
      return { art, ruhe: [0], max: 4.5, pause: [0.8, 2.5], ereignisse: [], naechstes: 0 }
  }
}

/** Wert einer Linie zum Zeitpunkt t. */
export function wertImKanal(kanal: Kanal, linie: number, t: number): number {
  for (const e of kanal.ereignisse) {
    if (t >= e.start && t < e.start + e.dauer) return wertBei(e.linien[linie], t - e.start)
  }
  return kanal.ruhe[linie]
}

/**
 * Plant Ereignisse bis `jetzt` ein und vergisst alte, die schon links aus dem Bild gelaufen sind.
 * `sichtbar` = wie viele Sekunden der Monitor zeigt.
 */
export function planen(kanal: Kanal, jetzt: number, sichtbar: number, z: Zufall): void {
  while (kanal.naechstes <= jetzt) {
    const e = erzeugeEreignis(kanal.art, kanal.naechstes, z)
    kanal.ereignisse.push(e)
    kanal.naechstes = e.start + e.dauer + zwischen(z, kanal.pause[0], kanal.pause[1])
  }
  kanal.ereignisse = kanal.ereignisse.filter((e) => e.start + e.dauer >= jetzt - sichtbar)
}

/** Klick: sofort ein Ereignis – oder direkt nach dem, das gerade läuft. */
export function ausloesen(kanal: Kanal, jetzt: number, z: Zufall): void {
  const laufend = kanal.ereignisse.find((e) => jetzt >= e.start && jetzt < e.start + e.dauer)
  const start = laufend ? laufend.start + laufend.dauer + 0.15 : jetzt
  // geplante Ereignisse, die mit dem neuen kollidieren würden, fallen weg
  kanal.ereignisse = kanal.ereignisse.filter((e) => e.start < start)
  const e = erzeugeEreignis(kanal.art, start, z)
  kanal.ereignisse.push(e)
  kanal.naechstes = e.start + e.dauer + zwischen(z, kanal.pause[0], kanal.pause[1])
}

/** Füllt den Monitor schon beim Öffnen: Ereignisse beginnen in der Vergangenheit. */
export function vorbereiten(kanal: Kanal, jetzt: number, sichtbar: number, z: Zufall): void {
  kanal.ereignisse = []
  kanal.naechstes = jetzt - sichtbar + zwischen(z, 0, 1.5)
  planen(kanal, jetzt, sichtbar, z)
}
