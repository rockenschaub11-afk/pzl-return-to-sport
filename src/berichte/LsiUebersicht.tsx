// LSI-Übersicht als eigenes SVG (Bericht-Redesign, Muster 27.10.2026): je Test eine Zeile, Achse 60–120 %,
// Korridor 90–110 % wie im Verlaufsdiagramm, Punkt in der LSI-Ampel, vorige Testung als hohler Punkt mit Verbindung.
// Die Achse reicht immer über alle Werte (mindestens 60–120 %), damit kein Punkt am Rand klebt.

import { AMPEL_ZEICHEN } from './bericht'
import type { LsiZeile } from './lsiZeilen'

const B = 640
const ZEILE = 15
const OBEN = 20
const X0 = 170
const X1 = 440
const WORT = { gruen: '', gelb: 'knapp', rot: 'nicht erfüllt' } as const

const zahl = (v: number) => `${v.toLocaleString('de-AT', { maximumFractionDigits: 1 })} %`

export default function LsiUebersicht({ zeilen, vorigeDatum }: { zeilen: LsiZeile[]; vorigeDatum: string | null }) {
  const H = OBEN + zeilen.length * ZEILE + 6
  const alle = zeilen.flatMap((z) => (z.vorige === null ? [z.lsi] : [z.lsi, z.vorige]))
  const LO = Math.min(60, Math.floor(Math.min(...alle) / 10) * 10)
  const HI = Math.max(120, Math.ceil(Math.max(...alle) / 10) * 10)
  const TICKS = Array.from({ length: (HI - LO) / 10 + 1 }, (_, i) => LO + i * 10)
  const x = (v: number) => X0 + ((v - LO) / (HI - LO)) * (X1 - X0)
  const mitVorige = zeilen.some((z) => z.vorige !== null)
  return (
    <figure className="lsi-uebersicht">
      <svg
        viewBox={`0 0 ${B} ${H}`}
        role="img"
        aria-label={`LSI je Test: ${zeilen.map((z) => `${z.name} ${zahl(z.lsi)}${z.ampel ? ` ${AMPEL_ZEICHEN[z.ampel]}` : ''}${z.vorige !== null ? `, zuvor ${zahl(z.vorige)}` : ''}`).join('; ')}`}
      >
        {zeilen.map((_, i) => (i % 2 === 0 ? <rect key={i} x={0} y={OBEN + i * ZEILE} width={B} height={ZEILE} className="lsi-streifen" /> : null))}
        <rect x={x(90)} y={OBEN - 4} width={x(110) - x(90)} height={H - OBEN} className="lsi-korridor" />
        {TICKS.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={OBEN - 4} y2={H - 2} className={t === 100 ? 'lsi-raster lsi-raster-100' : 'lsi-raster'} />
            <text x={x(t)} y={11} textAnchor="middle" className="lsi-text">
              {TICKS.length > 9 && t % 20 !== 0 ? '' : `${t} %`}
            </text>
          </g>
        ))}
        <text x={478} y={11} textAnchor="end" className="lsi-text">
          LSI
        </text>
        {mitVorige && (
          <text x={540} y={11} textAnchor="end" className="lsi-text">
            zuvor
          </text>
        )}
        {zeilen.map((z, i) => {
          const y = OBEN + i * ZEILE + ZEILE / 2
          const a = z.ampel
          return (
            <g key={z.id}>
              <text x={0} y={y + 3.5} className="lsi-name">
                {z.name}
              </text>
              {z.wuenschenswert && (
                <text x={X0 - 8} y={y + 3.5} textAnchor="end" className="lsi-text">
                  W
                </text>
              )}
              {z.vorige !== null && (
                <>
                  <line x1={x(z.vorige)} x2={x(z.lsi)} y1={y} y2={y} className="lsi-verbindung" />
                  <circle cx={x(z.vorige)} cy={y} r={3.2} className="lsi-vorige" />
                </>
              )}
              <circle cx={x(z.lsi)} cy={y} r={4.6} className={`lsi-punkt${a ? ` lsi-${a}` : ''}`} />
              <text x={478} y={y + 3.5} textAnchor="end" className="lsi-name lsi-wert">
                {zahl(z.lsi)}
              </text>
              {mitVorige && (
                <text x={540} y={y + 3.5} textAnchor="end" className="lsi-text">
                  {z.vorige === null ? '–' : zahl(z.vorige)}
                </text>
              )}
              {a && (
                <text x={mitVorige ? 556 : 496} y={y + 3.5} className={`lsi-zeichen lsi-${a}`}>
                  {AMPEL_ZEICHEN[a]} {WORT[a]}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <figcaption className="bericht-legende">
        <span>
          <i className="legende-korridor" />
          Korridor 90–110 %
        </span>
        <span>● aktuelle Testung, Farbe = Ampel ✓ ~ ✗</span>
        {mitVorige && vorigeDatum && <span>○ vorige Testung {vorigeDatum}</span>}
        {zeilen.some((z) => z.wuenschenswert) && <span>W = wünschenswert (blockiert nicht)</span>}
      </figcaption>
    </figure>
  )
}
