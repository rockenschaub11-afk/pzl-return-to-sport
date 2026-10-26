// Meloq-Metriken nach ODS aus config/meloq.json (docs/ENTSCHEIDUNGEN.md 6.4).

import meloqDatei from '../../config/meloq.json'

export type Ods = 'output' | 'driver' | 'strategy'
export const ODS_REIHENFOLGE: readonly Ods[] = ['output', 'driver', 'strategy']
export const MELOQ_TESTS = ['cmj', 'sl_cmj', 'sl_dj'] as const
export type MeloqTest = (typeof MELOQ_TESTS)[number]

export interface ZusatzMetrik {
  id: string
  name: string
  ods: Ods
  einheit: string
  relativ?: 'N/kg' | 'W/kg' | 'N/s'
  seitig: boolean
  tests: MeloqTest[]
  hinweis?: string
}

export interface KernMetrik {
  id: string
  name: string
  ods: Ods
  einheit?: string
}

export interface MeloqKatalog {
  ods: Record<Ods, { name: string; kurz: string; erklaerung: string }>
  odsHinweis: string
  odsQuelle: string
  kern: Record<MeloqTest, KernMetrik[]>
  zusatz: ZusatzMetrik[]
  standard: Record<MeloqTest, string[]>
  nichtMessbar: string
}

export const MELOQ = meloqDatei as unknown as MeloqKatalog

export const istMeloqTest = (id: string): id is MeloqTest => (MELOQ_TESTS as readonly string[]).includes(id)

export const zusatzFuer = (test: MeloqTest) => MELOQ.zusatz.filter((m) => m.tests.includes(test))

export function pruefeMeloq(m: MeloqKatalog): string[] {
  const fehler: string[] = []
  const ids = new Set<string>()
  for (const z of m.zusatz) {
    const wo = `meloq.json ${z.id}`
    if (ids.has(z.id)) fehler.push(`${wo}: doppelte id`)
    ids.add(z.id)
    if (!ODS_REIHENFOLGE.includes(z.ods)) fehler.push(`${wo}: unbekannte ODS-Gruppe „${z.ods}“`)
    if (!z.tests?.length || !z.tests.every((t) => istMeloqTest(t))) fehler.push(`${wo}: unbekannter Test`)
    if (z.relativ && !['N/kg', 'W/kg', 'N/s'].includes(z.relativ)) fehler.push(`${wo}: unbekannte Umrechnung „${z.relativ}“`)
  }
  for (const t of MELOQ_TESTS) {
    if (!m.kern?.[t]?.length) fehler.push(`meloq.json: Kern-Satz für ${t} fehlt`)
    for (const id of m.standard?.[t] ?? []) {
      if (!m.zusatz.some((z) => z.id === id && z.tests.includes(t))) fehler.push(`meloq.json standard ${t}: „${id}“ gibt es für diesen Test nicht`)
    }
  }
  return fehler
}
