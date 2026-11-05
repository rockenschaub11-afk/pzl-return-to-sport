// Spinnennetz L/R als eigenes SVG (ENTSCHEIDUNGEN Technik; Etappe-9-Frage 1):
// je Test mit Seitenvergleich eine Achse; gesundes Bein = 100-%-Ring, betroffenes Bein als Fläche in % (LSI), Ziel 90 % gestrichelt.
// Werte mit einer Nachkommastelle wie in der Tabelle, Punkt und Zeichen ✓ ~ ✗ nach der LSI-Ampel (Bericht-Audit Punkt 1).
// Bericht-Redesign (Muster 27.10.2026): Skala ab 50 % (Mitte) bis 120 %, damit Unterschiede um 90 % sichtbar werden – liegt ein Wert darunter,
// beginnt die Mitte tiefer (in 10er-Schritten), damit kein Wert in der Mitte verschwindet. Vorige Testung als hohler Punkt.
// Erster Pat. 04.11.2026 (Philipp): bei 1–2 Tests mit Seitenvergleich statt Hinweis waagrechte Balken in derselben Skala und Legende.

import type { Ampel } from '../rechnen/bewertung'
import { zahlDe } from '../rechnen/format'
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

const zahl = (v: number) => zahlDe(v, 1, true)
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
  if (n === 0) return <p className="hinweis-leise">Noch keine Tests mit Seitenvergleich erfasst.</p>
  const mitte = skalaStart(achsen)
  if (n < 3) return <SeitenBalken achsen={achsen} ziel={ziel} vorigeDatum={vorigeDatum} start={mitte} />
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
      <Legende achsen={achsen} ziel={ziel} vorigeDatum={vorigeDatum} />
    </figure>
  )
}

const hatVorige = (a: NetzAchse) => a.vorige !== null && a.vorige !== undefined

/** Beginn der Skala: 50 %, tiefer (10er-Schritte), wenn ein Wert darunter liegt */
function skalaStart(achsen: NetzAchse[]) {
  const werte = achsen.flatMap((a) => (hatVorige(a) ? [a.lsi, a.vorige!] : [a.lsi]))
  return Math.max(0, Math.min(MIN, Math.floor(Math.min(...werte) / 10) * 10 - 10))
}

function Legende({ achsen, ziel, vorigeDatum }: { achsen: NetzAchse[]; ziel: number; vorigeDatum: string | null }) {
  return (
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
      {vorigeDatum && achsen.some(hatVorige) && (
        <span>
          <i className="netz-legende-vorige" /> zuvor ({vorigeDatum})
        </span>
      )}
    </figcaption>
  )
}

/** Balken: eigene, schmalere Zeichenfläche, damit die Schrift in der halben Seitenbreite gut lesbar bleibt */
const BALKEN = { breite: 360, links: 6, rechts: 354, kopf: 24, balken: 14 }

/** Veränderung in Prozentpunkten mit echtem Minuszeichen: „+11,4“, „−3,0“ */
const pp = (d: number) => `${d > 0 ? '+' : d < 0 ? '−' : '±'}${zahl(Math.abs(d))}`

/**
 * 1–2 Tests mit Seitenvergleich: waagrechte Balken, betroffenes Bein in % des gesunden (LSI).
 * Skala wie im Spinnennetz (ab 50 %, tiefer wenn nötig, bis 120 %), Zielbereich ab dem Ziel leicht hinterlegt,
 * gesundes Bein = 100 % gestrichelt. Vorige Testung: hohler Punkt, Strich bis heute und Veränderung in Prozentpunkten.
 */
function SeitenBalken({ achsen, ziel, vorigeDatum, start }: { achsen: NetzAchse[]; ziel: number; vorigeDatum: string | null; start: number }) {
  const { breite, links, rechts, kopf, balken } = BALKEN
  const x = (prozent: number) => links + ((Math.min(Math.max(prozent, start), MAX) - start) / (MAX - start)) * (rechts - links)
  const mitVorige = achsen.some(hatVorige)
  const zeile = mitVorige ? 62 : 46
  const h = kopf + achsen.length * zeile
  const oben = kopf - 6
  const striche = Array.from({ length: Math.floor((MAX - start) / 10) + 1 }, (_, i) => start + i * 10)
  // Beschriftung: Skalenbeginn, 70, Ziel, 100, 120 – bei sehr tiefer Skala nur jede 20er-Marke dazwischen
  const beschriftet = new Set([start, ziel, 100, MAX, ...striche.filter((r) => r < ziel && (MAX - start <= 70 ? r % 10 === 0 : r % 20 === 0))])
  const veraenderung = (a: NetzAchse) => (hatVorige(a) ? Math.round((a.lsi - a.vorige!) * 10) / 10 : null)
  const label = achsen
    .map((a) => {
      const d = veraenderung(a)
      return `${a.name} ${mitZeichen(a)}${d === null ? '' : `, zuvor ${zahl(a.vorige!)} %, ${pp(d)} Prozentpunkte`}`
    })
    .join('; ')
  return (
    <figure className="netz netz-balken">
      <svg viewBox={`0 0 ${breite} ${h}`} role="img" aria-label={`Seitenvergleich: betroffenes Bein in Prozent des gesunden, Ziel ab ${ziel} %: ${label}`}>
        {striche
          .filter((r) => beschriftet.has(r))
          .map((r) => (
            <text key={r} x={x(r)} y={oben - 5} textAnchor={r === start ? 'start' : r === MAX ? 'end' : 'middle'} className="netz-balken-skala">
              {r === MAX ? `${r} %` : r}
            </text>
          ))}
        {achsen.map((a, i) => {
          const top = kopf + i * zeile
          const y = top + 22
          const mitte = y + balken / 2
          const d = veraenderung(a)
          return (
            <g key={i}>
              <text x={links} y={top + 15} className="netz-balken-name">
                {a.name}
              </text>
              <text x={rechts} y={top + 15} textAnchor="end" className={`netz-balken-wert netz-wert${ampelKlasse(a)}`}>
                {mitZeichen(a)}
              </text>
              <rect x={links} y={y} width={rechts - links} height={balken} rx={2} className="netz-balken-spur" />
              <rect x={x(ziel)} y={y} width={x(MAX) - x(ziel)} height={balken} className="netz-balken-zielbereich" />
              {striche.slice(1, -1).map((r) => (
                <line key={r} x1={x(r)} y1={y} x2={x(r)} y2={y + balken} className="netz-balken-strich" />
              ))}
              <rect x={links} y={y} width={Math.max(0, x(a.lsi) - links)} height={balken} rx={2} className="netz-flaeche netz-balken-fuellung" />
              {d !== null && (
                <>
                  <line x1={x(a.vorige!)} y1={mitte} x2={x(a.lsi)} y2={mitte} className="netz-balken-weg" />
                  <circle cx={x(a.vorige!)} cy={mitte} r={3} className="netz-vorige" />
                  <text x={links} y={y + balken + 14} className="netz-balken-zuvor">
                    zuvor {zahl(a.vorige!)} % · {pp(d)} Prozentpunkte
                  </text>
                </>
              )}
              <circle cx={x(a.lsi)} cy={mitte} r={a.ampel ? 4.5 : 3.5} className={`netz-punkt${ampelKlasse(a)}`} />
            </g>
          )
        })}
        <line x1={x(100)} y1={oben} x2={x(100)} y2={h} className="netz-gesund" />
        <line x1={x(ziel)} y1={oben} x2={x(ziel)} y2={h} className="netz-ziel" />
      </svg>
      <Legende achsen={achsen} ziel={ziel} vorigeDatum={vorigeDatum} />
    </figure>
  )
}
