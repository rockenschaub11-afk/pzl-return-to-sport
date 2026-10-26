// Score-Rechner (docs/ENTSCHEIDUNGEN.md 8): Antworten vom Papier abtippen, die App rechnet.
// Bewusst ohne Fragebogentexte (Lizenzen) – nur Item-Nummern und Wertebereich.

export interface Item {
  id: string
  min: number
  max: number
  /** angekreuzte Zahl wird umgedreht (IKDC 2, 3: 0 = kein Schmerz → 10 Punkte) */
  umkehren?: boolean
  /** Ja = 0 Punkte, Nein = 1 Punkt (IKDC 6) */
  janein?: boolean
}

export interface Ergebnis {
  /** Score bzw. je KOOS-Subskala */
  werte: { name: string; feld: string; score: number | null }[]
  meldungen: string[]
}

export interface Fragebogen {
  hilfe: string
  gruppen: { name: string; items: Item[] }[]
  rechne: (antworten: Record<string, string>) => Ergebnis
}

const nr = (praefix: string, von: number, bis: number, min: number, max: number): Item[] =>
  Array.from({ length: bis - von + 1 }, (_, i) => ({ id: `${praefix}${von + i}`, min, max }))

/** Gültige Antwort eines Items (Punkte) oder null; ungültige Eingaben werden gemeldet. */
function punkte(item: Item, roh: string | undefined, meldungen: string[]): number | null {
  if (roh === undefined || roh.trim() === '') return null
  if (item.janein) return roh === 'ja' ? 0 : roh === 'nein' ? 1 : null
  const z = Number(roh.replace(',', '.'))
  if (!Number.isFinite(z) || z < item.min || z > item.max) {
    meldungen.push(`Item ${item.id}: ${roh} liegt außerhalb ${item.min}–${item.max} – nicht gezählt.`)
    return null
  }
  return item.umkehren ? item.max - z : z
}

const feld = (id: string) => `f_${id}`

export const FRAGEBOEGEN: Record<string, Fragebogen> = {
  acl_rsi: {
    hilfe: '12 Items, je 0–100 (wie angekreuzt). Score = Mittelwert, alle 12 nötig.',
    gruppen: [{ name: 'Items', items: nr('', 1, 12, 0, 100) }],
    rechne(a) {
      const m: string[] = []
      const items = this.gruppen[0].items
      const w = items.map((i) => punkte(i, a[feld(i.id)], m)).filter((x): x is number => x !== null)
      if (w.length < items.length) m.push(`${items.length - w.length} von ${items.length} Items fehlen.`)
      return { werte: [{ name: 'ACL-RSI', feld: 'wert', score: w.length === items.length ? w.reduce((s, x) => s + x, 0) / w.length : null }], meldungen: m }
    },
  },

  ikdc: {
    hilfe: '18 bewertete Items, Punkte laut IKDC-Auswertung (höher = besser). Bei 2 und 3 die angekreuzte Zahl eintragen – die App rechnet 10 − Wert. 10a wird nicht gewertet. Höchstens 2 Items dürfen fehlen.',
    gruppen: [
      {
        name: 'Items 1–8',
        items: [
          { id: '1', min: 0, max: 4 },
          { id: '2', min: 0, max: 10, umkehren: true },
          { id: '3', min: 0, max: 10, umkehren: true },
          { id: '4', min: 0, max: 4 },
          { id: '5', min: 0, max: 4 },
          { id: '6', min: 0, max: 1, janein: true },
          { id: '7', min: 0, max: 4 },
          { id: '8', min: 0, max: 4 },
        ],
      },
      { name: 'Items 9a–9i', items: 'abcdefghi'.split('').map((b) => ({ id: `9${b}`, min: 0, max: 4 })) },
      { name: 'Item 10b', items: [{ id: '10b', min: 0, max: 10 }] },
    ],
    rechne(a) {
      const m: string[] = []
      const items = this.gruppen.flatMap((g) => g.items)
      let summe = 0
      let maximum = 0
      let fehlt = 0
      for (const i of items) {
        const p = punkte(i, a[feld(i.id)], m)
        if (p === null) fehlt++
        else {
          summe += p
          maximum += i.max
        }
      }
      if (fehlt > 2) m.push(`${fehlt} Items fehlen – höchstens 2 erlaubt.`)
      return { werte: [{ name: 'IKDC', feld: 'wert', score: fehlt <= 2 && maximum > 0 ? (summe / maximum) * 100 : null }], meldungen: m }
    },
  },

  koos: {
    hilfe: 'Je Item 0–4 (linke Antwort = 0). Subskala = 100 − Mittelwert × 25; mindestens die Hälfte der Items je Subskala nötig. Kein Gesamtscore.',
    gruppen: [
      { name: 'Symptome', items: nr('S', 1, 7, 0, 4) },
      { name: 'Schmerz', items: nr('P', 1, 9, 0, 4) },
      { name: 'Alltag (ADL)', items: nr('A', 1, 17, 0, 4) },
      { name: 'Sport/Freizeit', items: nr('SP', 1, 5, 0, 4) },
      { name: 'Lebensqualität', items: nr('Q', 1, 4, 0, 4) },
    ],
    rechne(a) {
      const m: string[] = []
      const felder = ['koos_symptome', 'koos_schmerz', 'koos_alltag', 'koos_sport', 'koos_lebensqualitaet']
      const werte = this.gruppen.map((g, gi) => {
        const w = g.items.map((i) => punkte(i, a[feld(i.id)], m)).filter((x): x is number => x !== null)
        const genug = w.length >= g.items.length / 2
        if (!genug && w.length > 0) m.push(`${g.name}: weniger als die Hälfte der Items beantwortet.`)
        return { name: g.name, feld: felder[gi], score: genug ? 100 - (w.reduce((s, x) => s + x, 0) / w.length) * 25 : null }
      })
      return { werte, meldungen: m }
    },
  },

  tampa: {
    hilfe: '11 Items, je 1–4. Summe 11–44, alle 11 nötig.',
    gruppen: [{ name: 'Items', items: nr('', 1, 11, 1, 4) }],
    rechne(a) {
      const m: string[] = []
      const items = this.gruppen[0].items
      const w = items.map((i) => punkte(i, a[feld(i.id)], m)).filter((x): x is number => x !== null)
      if (w.length < items.length) m.push(`${items.length - w.length} von ${items.length} Items fehlen.`)
      return { werte: [{ name: 'TSK-11', feld: 'wert', score: w.length === items.length ? w.reduce((s, x) => s + x, 0) : null }], meldungen: m }
    },
  },
}

export const antwortFeld = feld
