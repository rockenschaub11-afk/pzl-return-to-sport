// Motor Control (Bewegungsqualität) aus config/motorcontrol.json – Tests, Segmente, Kompensationen, Quelle.
// Entscheidung Philipp 04.11.2026 (docs/ENTSCHEIDUNGEN.md): Scoring nach Aspetar, nur Info, keine Ampel.

import motorDatei from '../../config/motorcontrol.json'

export const SEGMENTE = ['fuss', 'knie', 'rumpf'] as const
export type Segment = (typeof SEGMENTE)[number]

export interface Kompensation {
  id: string
  name: string
  /** Begriff im Aspetar-Material */
  original: string
}

export interface MotorTestDef {
  id: string
  name: string
  /** je Seite bewertet (betroffen/gesund) oder einmal beidbeinig */
  einbeinig: boolean
  /** welche Kompensationsliste gilt */
  liste: string
  /** Seite im Aspetar-Material bzw. Hinweis zur Herkunft */
  quelle: string
}

export interface MotorKatalog {
  quelle: string
  segmente: { id: Segment; name: string }[]
  listen: Record<string, Record<Segment, Kompensation[]>>
  tests: MotorTestDef[]
}

export const MOTOR = motorDatei as MotorKatalog

export const motorTestNach = (id: string) => MOTOR.tests.find((t) => t.id === id)
export const segmentName = (s: Segment) => MOTOR.segmente.find((x) => x.id === s)?.name ?? s

/** Prüfung beim Start – gleiche Art wie pruefeKatalog: eine Meldung je Problem. */
export function pruefeMotor(m: MotorKatalog): string[] {
  const fehler: string[] = []
  const wo = 'motorcontrol.json'
  if (!m.quelle?.trim()) fehler.push(`${wo}: quelle fehlt`)
  if (m.segmente?.map((s) => s.id).join() !== SEGMENTE.join()) fehler.push(`${wo}: segmente müssen ${SEGMENTE.join(', ')} sein`)
  for (const [name, liste] of Object.entries(m.listen ?? {})) {
    for (const s of SEGMENTE) {
      const k = liste?.[s]
      if (!Array.isArray(k) || k.length === 0) fehler.push(`${wo} Liste ${name}: Segment ${s} ohne Kompensationen`)
      else if (new Set(k.map((x) => x.id)).size !== k.length || k.some((x) => !x.id || !x.name?.trim())) fehler.push(`${wo} Liste ${name}, ${s}: id doppelt oder Name fehlt`)
    }
  }
  const ids = new Set<string>()
  for (const t of m.tests ?? []) {
    if (!t.id || ids.has(t.id)) fehler.push(`${wo}: Test-id fehlt oder doppelt (${t.id})`)
    ids.add(t.id)
    if (!t.name?.trim()) fehler.push(`${wo} ${t.id}: Name fehlt`)
    if (typeof t.einbeinig !== 'boolean') fehler.push(`${wo} ${t.id}: einbeinig muss true oder false sein`)
    if (!m.listen?.[t.liste]) fehler.push(`${wo} ${t.id}: unbekannte Liste „${t.liste}“`)
  }
  if (ids.size === 0) fehler.push(`${wo}: keine Tests`)
  return fehler
}
