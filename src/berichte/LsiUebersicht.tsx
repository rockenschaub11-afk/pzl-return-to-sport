// LSI-Übersicht als eigenes SVG (Bericht-Redesign, Muster 27.10.2026): je Test eine Zeile, Achse 60–120 %,
// Korridor 90–110 % wie im Verlaufsdiagramm, Punkt in der LSI-Ampel, vorige Testung als hohler Punkt mit Verbindung.
// Die Achse reicht immer über alle Werte (mindestens 60–120 %), damit kein Punkt am Rand klebt.
// Visualisierung Stufe 1: Bestwerte gesund | betroffen vor der Achse (der LSI allein verdeckt, wenn beide Seiten schwach sind)
// und die Spanne aus den Einzelversuchen als heller Balken hinter dem Punkt.

import type { CSSProperties } from 'react'
import { AMPEL_ZEICHEN } from './bericht'
import type { LsiZeile } from './lsiZeilen'

const OBEN = 20
const WORT = { gruen: '', gelb: 'knapp', rot: 'nicht erfüllt' } as const

const zahl = (v: number) => `${v.toLocaleString('de-AT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`

/** Spalten: ohne Seitenwerte wie bisher, mit Seitenwerten zwei Spalten mehr vor der Achse. */
function spalten(mitSeiten: boolean) {
  const r = mitSeiten ? 175 : 0
  return { B: 640 + r, X0: 170 + r, X1: 430 + r, gesund: 236, betroffen: 306, lsi: 478 + r, zuvor: 540 + r }
}

/** bewegt: Punkte wandern einmal vom Wert der vorigen Testung zum aktuellen (nur am Bildschirm, nicht im Bericht). */
export default function LsiUebersicht({ zeilen, vorigeDatum, zeile: ZEILE = 15, bewegt = false }: { zeilen: LsiZeile[]; vorigeDatum: string | null; zeile?: number; bewegt?: boolean }) {
  const H = OBEN + zeilen.length * ZEILE + 6
  const mitSeiten = zeilen.some((z) => z.gesund !== undefined || z.betroffen !== undefined)
  const { B, X0, X1, ...S } = spalten(mitSeiten)
  const alle = zeilen.flatMap((z) => [z.lsi, ...(z.vorige === null ? [] : [z.vorige]), ...(z.spanne ?? [])])
  const LO = Math.min(60, Math.floor(Math.min(...alle) / 10) * 10)
  const HI = Math.max(120, Math.ceil(Math.max(...alle) / 10) * 10)
  const TICKS = Array.from({ length: (HI - LO) / 10 + 1 }, (_, i) => LO + i * 10)
  const x = (v: number) => X0 + ((v - LO) / (HI - LO)) * (X1 - X0)
  const mitVorige = zeilen.some((z) => z.vorige !== null)
  const mitSpanne = zeilen.some((z) => z.spanne)
  const seitenText = (z: LsiZeile) => (mitSeiten ? `, gesund ${z.gesund ?? '–'}, betroffen ${z.betroffen ?? '–'}` : '')
  const spanneText = (z: LsiZeile) => (z.spanne ? `, Spanne der Versuche ${zahl(z.spanne[0])} bis ${zahl(z.spanne[1])}` : '')
  return (
    <figure className="lsi-uebersicht">
      <svg
        viewBox={`0 0 ${B} ${H}`}
        role="img"
        aria-label={`LSI je Test: ${zeilen.map((z) => `${z.name} ${zahl(z.lsi)}${z.ampel ? ` ${AMPEL_ZEICHEN[z.ampel]}` : ''}${z.vorige !== null ? `, zuvor ${zahl(z.vorige)}` : ''}${seitenText(z)}${spanneText(z)}`).join('; ')}`}
      >
        {zeilen.map((_, i) => (i % 2 === 0 ? <rect key={i} x={0} y={OBEN + i * ZEILE} width={B} height={ZEILE} className="lsi-streifen" /> : null))}
        <rect x={x(90)} y={OBEN - 4} width={x(110) - x(90)} height={H - OBEN} className="lsi-korridor" />
        <line x1={x(90)} x2={x(90)} y1={OBEN - 4} y2={H - 4} className="lsi-ziel" />
        {TICKS.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={OBEN - 4} y2={H - 2} className={t === 100 ? 'lsi-raster lsi-raster-100' : 'lsi-raster'} />
            <text x={x(t)} y={11} textAnchor="middle" className="lsi-text">
              {TICKS.length > 9 && t % 20 !== 0 ? '' : `${t} %`}
            </text>
          </g>
        ))}
        {mitSeiten && (
          <>
            <text x={S.gesund} y={11} textAnchor="end" className="lsi-text">
              gesund
            </text>
            <text x={S.betroffen} y={11} textAnchor="end" className="lsi-text">
              betroffen
            </text>
          </>
        )}
        <text x={S.lsi} y={11} textAnchor="end" className="lsi-text">
          LSI
        </text>
        {mitVorige && (
          <text x={S.zuvor} y={11} textAnchor="end" className="lsi-text">
            zuvor
          </text>
        )}
        {zeilen.map((z, i) => {
          const y = OBEN + i * ZEILE + ZEILE / 2
          const a = z.ampel
          return (
            <g key={z.id} className="lsi-zeile">
              <rect x={0} y={OBEN + i * ZEILE} width={B} height={ZEILE} className="lsi-treffer" />
              <text x={0} y={y + 3.5} className="lsi-name">
                {z.name}
              </text>
              {z.wuenschenswert && (
                <text x={mitSeiten ? 168 : X0 - 8} y={y + 3.5} textAnchor="end" className="lsi-text">
                  W
                </text>
              )}
              {mitSeiten && (
                <>
                  <text x={S.gesund} y={y + 3.5} textAnchor="end" className="lsi-text lsi-seite">
                    {z.gesund ?? '–'}
                  </text>
                  <text x={S.betroffen} y={y + 3.5} textAnchor="end" className="lsi-name lsi-seite">
                    {z.betroffen ?? '–'}
                  </text>
                </>
              )}
              {z.spanne && <rect x={x(z.spanne[0]) - 3.5} y={y - 3.5} width={x(z.spanne[1]) - x(z.spanne[0]) + 7} height={7} rx={3.5} className="lsi-spanne" />}
              {z.vorige !== null && (
                <>
                  <line x1={x(z.vorige)} x2={x(z.lsi)} y1={y} y2={y} pathLength={1} className={`lsi-verbindung${bewegt ? ' lsi-wandert' : ''}`} style={{ '--stufe': i } as CSSProperties} />
                  <circle cx={x(z.vorige)} cy={y} r={3.2} className="lsi-vorige" />
                </>
              )}
              <circle
                cx={x(z.lsi)}
                cy={y}
                r={4.6}
                className={`lsi-punkt${a ? ` lsi-${a}` : ''}${bewegt && z.vorige !== null ? ' lsi-wandert' : ''}`}
                style={z.vorige === null ? undefined : ({ '--stufe': i, '--weg': `${x(z.vorige) - x(z.lsi)}px` } as CSSProperties)}
              />
              <text x={S.lsi} y={y + 3.5} textAnchor="end" className="lsi-name lsi-wert">
                {zahl(z.lsi)}
              </text>
              {mitVorige && (
                <text x={S.zuvor} y={y + 3.5} textAnchor="end" className="lsi-text">
                  {z.vorige === null ? '–' : zahl(z.vorige)}
                </text>
              )}
              {a && (
                <text x={mitVorige ? S.zuvor + 16 : S.lsi + 18} y={y + 3.5} className={`lsi-zeichen lsi-${a}`}>
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
        {mitSpanne && (
          <span>
            <i className="legende-spanne" />
            Spanne aus allen Versuchen
          </span>
        )}
        {mitVorige && vorigeDatum && <span>○ vorige Testung {vorigeDatum}</span>}
        {mitSeiten && <span>gesund | betroffen = Bestwerte</span>}
        {zeilen.some((z) => z.wuenschenswert) && <span>W = wünschenswert (blockiert nicht)</span>}
      </figcaption>
    </figure>
  )
}
