// Spinnennetz L/R als eigenes SVG (ENTSCHEIDUNGEN Technik; Etappe-9-Frage 1):
// je Test mit Seitenvergleich eine Achse; gesundes Bein = 100-%-Ring, betroffenes Bein als Fläche in % (LSI), Ziel 90 % gestrichelt.
// Werte mit einer Nachkommastelle wie in der Tabelle, Punkt und Zeichen ✓ ~ ✗ nach der LSI-Ampel (Bericht-Audit Punkt 1).
// Bericht-Redesign (Muster 27.10.2026): Skala ab 50 % (Mitte) bis 120 %, damit Unterschiede um 90 % sichtbar werden – liegt ein Wert darunter,
// beginnt die Mitte tiefer (in 10er-Schritten), damit kein Wert in der Mitte verschwindet. Vorige Testung als hohler Punkt.

import type { Ampel } from '../rechnen/bewertung'
import { AMPEL_ZEICHEN } from './bericht'

export interface NetzAchse {
  name: string
  lsi: number
  /** Ampel des LSI-Kriteriums (null = ohne Ampel) */
  ampel: Ampel | null
  /** LSI bei der vorigen Testung (null = keine) */
  vorige?: number | null
}

const B = 460
const H = 340
const MITTE = { x: B / 2, y: H / 2 + 2 }
const RADIUS = 112
/** äußerster Ring – LSI darüber wird am Rand gezeichnet */
const MAX = 120
/** Mitte des Netzes, wenn kein Wert darunter liegt */
const MIN = 50
const RINGE = [70, 100, 120]

const zahl = (v: number) => v.toLocaleString('de-AT', { maximumFractionDigits: 1 })
const mitZeichen = (a: NetzAchse) => `${zahl(a.lsi)} %${a.ampel ? ` ${AMPEL_ZEICHEN[a.ampel]}` : ''}`
const ampelKlasse = (a: NetzAchse) => (a.ampel ? ` netz-${a.ampel}` : '')

function punkt(i: number, n: number, prozent: number, mitte: number) {
  const winkel = -Math.PI / 2 + (2 * Math.PI * i) / n
  const r = ((Math.min(Math.max(prozent, mitte), MAX) - mitte) / (MAX - mitte)) * RADIUS
  return { x: MITTE.x + r * Math.cos(winkel), y: MITTE.y + r * Math.sin(winkel), cos: Math.cos(winkel), sin: Math.sin(winkel) }
}

const linie = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

export default function Spinnennetz({ achsen, ziel = 90, vorigeDatum = null }: { achsen: NetzAchse[]; ziel?: number; vorigeDatum?: string | null }) {
  const n = achsen.length
  if (n < 3) return <p className="hinweis-leise">Für das Spinnennetz braucht es mindestens 3 Tests mit Seitenvergleich.</p>
  const werte = achsen.flatMap((a) => (a.vorige === null || a.vorige === undefined ? [a.lsi] : [a.lsi, a.vorige]))
  const mitte = Math.max(0, Math.min(MIN, Math.floor(Math.min(...werte) / 10) * 10 - 10))
  const ring = (prozent: number) => linie(achsen.map((_, i) => punkt(i, n, prozent, mitte)))

  return (
    <figure className="netz">
      <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label={`Spinnennetz: betroffenes Bein in Prozent des gesunden, ${achsen.map((a) => `${a.name} ${mitZeichen(a)}`).join(', ')}`}>
        {RINGE.map((r) => (
          <polygon key={r} points={ring(r)} className="netz-ring" />
        ))}
        {achsen.map((_, i) => {
          const p = punkt(i, n, MAX, mitte)
          return <line key={i} x1={MITTE.x} y1={MITTE.y} x2={p.x} y2={p.y} className="netz-achse" />
        })}
        <polygon points={ring(100)} className="netz-gesund" />
        <polygon points={ring(ziel)} className="netz-ziel" />
        <polygon points={linie(achsen.map((a, i) => punkt(i, n, a.lsi, mitte)))} className="netz-flaeche" style={{ transformOrigin: `${MITTE.x}px ${MITTE.y}px` }} />
        {achsen.map((a, i) => {
          if (a.vorige === null || a.vorige === undefined) return null
          const p = punkt(i, n, a.vorige, mitte)
          return <circle key={`v${i}`} cx={p.x} cy={p.y} r={3} className="netz-vorige" />
        })}
        {achsen.map((a, i) => {
          const p = punkt(i, n, a.lsi, mitte)
          return <circle key={i} cx={p.x} cy={p.y} r={a.ampel ? 4.5 : 3.5} className={`netz-punkt${ampelKlasse(a)}`} />
        })}
        {achsen.map((a, i) => {
          const p = punkt(i, n, MAX, mitte)
          const anker = Math.abs(p.cos) < 0.2 ? 'middle' : p.cos > 0 ? 'start' : 'end'
          const x = p.x + p.cos * 8
          const y = p.y + p.sin * 12 + (p.sin > 0.2 ? 10 : -6)
          return (
            <text key={i} x={x} y={y} textAnchor={anker} className="netz-text">
              <tspan>{a.name}</tspan>
              <tspan x={x} dy="1.15em" className={`netz-wert${ampelKlasse(a)}`}>
                {mitZeichen(a)}
              </tspan>
            </text>
          )
        })}
        {[70, 100].map((r) => (
          <text key={r} x={MITTE.x + 4} y={punkt(0, n, r, mitte).y + 11} className="netz-ring-text">
            {r} %
          </text>
        ))}
      </svg>
      <figcaption className="netz-legende">
        <span>
          <i className="netz-legende-gesund" /> gesundes Bein = 100 %
        </span>
        <span>
          <i className="netz-legende-betroffen" /> betroffenes Bein
        </span>
        <span>
          <i className="netz-legende-ziel" /> Ziel {ziel} %
        </span>
        {vorigeDatum && achsen.some((a) => a.vorige !== null && a.vorige !== undefined) && (
          <span>
            <i className="netz-legende-vorige" /> zuvor ({vorigeDatum})
          </span>
        )}
      </figcaption>
    </figure>
  )
}
