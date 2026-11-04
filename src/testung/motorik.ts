// Motor Control: Score je Seite nach Aspetar (config/motorcontrol.json) und Hinweis bei Seitenunterschied.
// Nur Info – keine Ampel, kein Einfluss auf RTS-Vorschlag oder „Tests erfasst“ (Philipp 04.11.2026).

import type { MotorSeite, MotorTest, Testung } from '../db'
import { MOTOR, SEGMENTE, segmentName, type MotorTestDef, type Segment } from '../katalog/motorcontrol'

export const TEXT_MAX = 300
export type MotorSeiteId = 'b' | 'g' | 'v'

/** Seiten eines Tests in Anzeige-Reihenfolge */
export const seitenVon = (t: MotorTestDef): MotorSeiteId[] => (t.einbeinig ? ['b', 'g'] : ['v'])

export const SEITEN_NAME: Record<MotorSeiteId, string> = { b: 'betroffen', g: 'gesund', v: 'beidbeinig' }

/** Segmente mit mindestens einer angekreuzten Kompensation */
export function auffaelligeSegmente(s: MotorSeite): Segment[] {
  return SEGMENTE.filter((seg) => s.kompensationen.some((k) => k.startsWith(`${seg}:`)))
}

/** 3/3 = kein Segment auffällig … 0/3 = alle drei auffällig oder nicht verlässlich durchführbar; null = nicht bewertet */
export function score(s: MotorSeite | undefined): number | null {
  if (!s) return null
  if (s.status === 'nicht_durchfuehrbar') return 0
  return SEGMENTE.length - auffaelligeSegmente(s).length
}

export const scoreText = (n: number | null) => (n === null ? '–' : `${n}/3`)

/** Hinweis, wenn die betroffene Seite weniger Punkte hat als die gesunde (jeder Punkt zählt, keine Schwelle). */
export function seitenunterschied(t: MotorTest | undefined): boolean {
  const b = score(t?.b)
  const g = score(t?.g)
  return b !== null && g !== null && b < g
}

export const istBewertet = (t: MotorTest | undefined) => !!t && (['b', 'g', 'v'] as const).some((s) => t[s])

/** Namen der angekreuzten Kompensationen je Segment, z. B. „Knie: Valgus“ */
export function kompensationenText(def: MotorTestDef, s: MotorSeite): string[] {
  const liste = MOTOR.listen[def.liste]
  return SEGMENTE.flatMap((seg) => {
    const namen = s.kompensationen.filter((k) => k.startsWith(`${seg}:`)).map((k) => liste?.[seg]?.find((x) => `${seg}:${x.id}` === k)?.name ?? k.slice(seg.length + 1))
    return namen.length ? [`${segmentName(seg)}: ${namen.join(', ')}`] : []
  })
}

/** Kurzform für Übersicht und Verlauf: „2/3“ bzw. „b 2/3 · g 3/3“ */
export function scoreKurz(def: MotorTestDef, t: MotorTest | undefined): string | null {
  if (!istBewertet(t)) return null
  if (!def.einbeinig) return scoreText(score(t!.v))
  return `b ${scoreText(score(t!.b))} · g ${scoreText(score(t!.g))}`
}

/** Bewertete Motor-Control-Tests einer Testung in Katalog-Reihenfolge */
export function motorBewertungen(testung: Pick<Testung, 'motorControl'>): { def: MotorTestDef; t: MotorTest }[] {
  return MOTOR.tests.flatMap((def) => {
    const t = testung.motorControl?.[def.id]
    return t && (istBewertet(t) || t.text?.trim()) ? [{ def, t }] : []
  })
}
