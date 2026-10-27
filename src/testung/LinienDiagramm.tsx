// Verlaufsdiagramm „Korridor“ als eigenes SVG (docs/DESIGNKONZEPT.md 6, 10.6):
// Zeitachse in Monaten seit OP, Phasen als feine Linien, Zielkorridor aus den Schwellen,
// Linien = Seite (betroffen durchgezogen, gesund gestrichelt), Punkte = tatsächliche Ampel, Lücken sichtbar.

import { useEffect, useRef, useState } from 'react'
import { datumDeutsch } from '../patienten/stammdaten'
import type { Ampel } from '../rechnen/bewertung'
import { AMPEL_TEXT, AmpelMarke } from './Ladebalken'
import type { Zielkorridor } from './verlauf'

export interface Reihe {
  name: string
  farbe: string
  /** gestrichelt – damit die Linien auch in Schwarz-Weiß unterscheidbar sind */
  gestrichelt?: boolean
}

export interface DiagrammPunkt {
  datum: string
  /** Monate seit OP mit Nachkommastellen */
  monate: number | null
  phase: string
  /** ein Wert je Reihe */
  werte: (number | null)[]
  /** Ampel der letzten Reihe (betroffen bzw. der einzige Wert) */
  ampel: Ampel | null
}

export interface FehlendePunkt {
  datum: string
  monate: number | null
  phase: string
}

interface Props {
  titel: string
  einheit: string
  punkte: DiagrammPunkt[]
  reihen: Reihe[]
  phasen: readonly { name: string; von: number; bis: number | null }[]
  korridor?: Zielkorridor | null
  fehlend?: FehlendePunkt[]
  /** Achse ab 0 beginnen (Kraft, Höhe) – sonst um die Werte herum (LSI) */
  abNull?: boolean
  nachkomma?: number
  /** welches Kriterium die Punkt-Ampel bewertet, z. B. „Kraft relativ“ */
  bewertet?: string
  /** Satz, wenn es kein Ziel gibt (DESIGNKONZEPT 6: kein Korridor, dafür ein Satz) */
  hinweis?: string
}

const H = 250
const R = { links: 46, rechts: 16, oben: 28, unten: 40 }
const SYMBOL: Record<Ampel, string> = { gruen: '✓', gelb: '~', rot: '✗' }
const AMPEL_FARBE: Record<Ampel, string> = { gruen: 'var(--erfuellt)', gelb: 'var(--knapp)', rot: 'var(--nicht-erfuellt)' }

/** schöne Achsenteilung mit 4–6 Strichen */
function teilung(min: number, max: number): number[] {
  const spanne = max - min || Math.abs(max) || 1
  const roh = spanne / 5
  const zehner = Math.pow(10, Math.floor(Math.log10(roh)))
  const schritt = [1, 2, 2.5, 5, 10].map((f) => f * zehner).find((s) => s >= roh) ?? 10 * zehner
  const start = Math.floor(min / schritt) * schritt
  const striche: number[] = [Math.round(start * 1000) / 1000]
  while (striche[striche.length - 1] < max) striche.push(Math.round((striche[striche.length - 1] + schritt) * 1000) / 1000)
  return striche
}

const zahl = (v: number, nachkomma = 1) => v.toLocaleString('de-AT', { maximumFractionDigits: nachkomma })

/** Breite der Karte messen, damit die Schrift in echten Pixeln gezeichnet wird (nicht verkleinert). */
function useBreite(standard = 640) {
  const ref = useRef<HTMLElement>(null)
  const [breite, setBreite] = useState(standard)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width)
      if (w > 0) setBreite((alt) => (alt === w ? alt : w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, breite] as const
}

export default function LinienDiagramm({ titel, einheit, punkte, reihen, phasen, korridor, fehlend = [], abNull = true, nachkomma = 1, bewertet, hinweis }: Props) {
  const [ref, B] = useBreite()
  const [aktiv, setAktiv] = useState<number | null>(null)

  const mitZeit = punkte.filter((p) => p.monate !== null)
  const alleMonate = [...mitZeit.map((p) => p.monate!), ...fehlend.filter((f) => f.monate !== null).map((f) => f.monate!)]
  const xMax = Math.max(12, Math.ceil(Math.max(0, ...alleMonate)) + 1)
  const x = (m: number) => R.links + (m / xMax) * (B - R.links - R.rechts)

  const werte = punkte.flatMap((p) => p.werte).filter((w): w is number => w !== null)
  const ziele = [...(korridor?.stufen.map((s) => s.wert) ?? []), ...(korridor?.grenze ? [korridor.grenze] : [])]
  const alle = [...werte, ...ziele]
  const lo = abNull ? 0 : Math.min(...alle) - 5
  const hi = abNull ? Math.max(...alle) * 1.12 : Math.max(...alle) + 5
  const striche = teilung(lo, hi)
  const yMin = striche[0]
  const yMax = striche[striche.length - 1]
  const y = (v: number) => R.oben + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - R.oben - R.unten)
  const unten = H - R.unten
  const letzte = reihen.length - 1

  // Linien je Reihe, unterbrochen bei „nicht gemessen“
  const zeitlinie = [
    ...mitZeit.map((p) => ({ m: p.monate!, p })),
    ...fehlend.filter((f) => f.monate !== null).map((f) => ({ m: f.monate!, p: null })),
  ].sort((a, b) => a.m - b.m)
  const linien = reihen.map((_, ri) => {
    const teile: { m: number; v: number }[][] = [[]]
    for (const z of zeitlinie) {
      const v = z.p?.werte[ri] ?? null
      if (z.p === null || v === null) {
        if (teile[teile.length - 1].length) teile.push([])
      } else teile[teile.length - 1].push({ m: z.m, v })
    }
    return teile.filter((t) => t.length > 1)
  })

  const ziele_ = [...mitZeit.map((p, i) => ({ art: 'punkt' as const, i, m: p.monate! })), ...fehlend.map((f, i) => ({ art: 'fehlt' as const, i, m: f.monate }))]
  const info = aktiv === null ? null : ziele_[aktiv]

  return (
    <figure className="diagramm" ref={ref as React.RefObject<HTMLElement & HTMLDivElement>}>
      <figcaption>
        {titel}
        {einheit && <span className="diagramm-einheit">, {einheit}</span>}
      </figcaption>
      <svg viewBox={`0 0 ${B} ${H}`} width={B} height={H} role="img" aria-label={`${titel} (${einheit})`}>
        {/* Raster nur waagrecht */}
        {striche.map((s) => (
          <g key={s}>
            <line x1={R.links} x2={B - R.rechts} y1={y(s)} y2={y(s)} className="diagramm-raster" />
            <text x={R.links - 8} y={y(s) + 4} className="diagramm-achse diagramm-achse-y">
              {zahl(s)}
            </text>
          </g>
        ))}

        {/* Zielkorridor – das einzige Grau */}
        {korridor?.stufen.map((s) => {
          const von = x(Math.min(s.von, xMax))
          const bis = x(Math.min(s.bis ?? xMax, xMax))
          if (bis <= von) return null
          const ys = y(Math.min(Math.max(s.wert, yMin), yMax))
          const y1 = korridor.richtung === 'oben' ? (korridor.grenze ? y(Math.min(korridor.grenze, yMax)) : R.oben) : ys
          const y2 = korridor.richtung === 'oben' ? ys : unten
          return <rect key={s.von} x={von} y={y1} width={bis - von} height={Math.max(0, y2 - y1)} className="diagramm-korridor" />
        })}

        {/* Phasen als feine senkrechte Linien mit Namen */}
        {phasen.map((p) => {
          if (p.von >= xMax) return null
          const bis = Math.min(p.bis ?? xMax, xMax)
          return (
            <g key={p.name}>
              {p.von > 0 && <line x1={x(p.von)} x2={x(p.von)} y1={R.oben - 6} y2={unten} className="diagramm-phase" />}
              {x(bis) - x(p.von) > 34 && (
                <text x={(x(p.von) + x(bis)) / 2} y={R.oben - 12} className="diagramm-phase-text">
                  {p.name}
                </text>
              )}
            </g>
          )
        })}

        {/* Zeitachse in Monaten seit OP */}
        {Array.from({ length: Math.floor(xMax / 3) + 1 }, (_, i) => i * 3).map((m) => (
          <text key={m} x={x(m)} y={unten + 18} className="diagramm-achse diagramm-achse-x">
            {m}
          </text>
        ))}
        <text x={B - R.rechts} y={unten + 34} className="diagramm-achse diagramm-achse-y">
          Monate seit OP
        </text>

        {/* Linien = Seite */}
        {linien.map((teile, ri) =>
          teile.map((t, ti) => (
            <polyline
              key={`${ri}-${ti}`}
              points={t.map((p) => `${x(p.m)},${y(p.v)}`).join(' ')}
              fill="none"
              style={{ stroke: reihen[ri].farbe }}
              strokeWidth={ri === letzte ? 2.5 : 2}
              strokeDasharray={reihen[ri].gestrichelt ? '6 5' : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              className={ri === letzte ? 'diagramm-linie' : undefined}
              pathLength={ri === letzte ? 1 : undefined}
            />
          )),
        )}

        {/* „nicht gemessen“ */}
        {fehlend.map((f) =>
          f.monate === null ? null : <circle key={`f-${f.datum}`} cx={x(f.monate)} cy={unten - 14} r={7} className="diagramm-fehlt" />,
        )}

        {/* Punkte: kleine hohle für gesund, gefüllte in Ampelfarbe + Zeichen für den bewerteten Wert */}
        {mitZeit.map((p) =>
          reihen.map((r, ri) => {
            const v = p.werte[ri]
            if (v === null) return null
            const cx = x(p.monate!)
            if (ri !== letzte) return <circle key={`${p.datum}-${ri}`} cx={cx} cy={y(v)} r={3.5} style={{ fill: 'var(--flaeche)', stroke: r.farbe }} strokeWidth={2} />
            const farbe = p.ampel ? AMPEL_FARBE[p.ampel] : r.farbe
            return (
              <g key={`${p.datum}-${ri}`}>
                <circle cx={cx} cy={y(v)} r={6} style={{ fill: farbe, stroke: 'var(--flaeche)' }} strokeWidth={2.5} />
                {p.ampel && (
                  <text x={cx} y={y(v) + 22} className="diagramm-symbol" style={{ fill: farbe }}>
                    {SYMBOL[p.ampel]}
                  </text>
                )}
              </g>
            )
          }),
        )}

        {/* Bereiche für Maus und Tastatur – zeigen das Info-Fenster */}
        {ziele_.map((z, i) =>
          z.m === null ? null : (
            <g key={`z-${i}`}>
              <rect
                x={x(z.m) - 22}
                y={R.oben}
                width={44}
                height={unten - R.oben}
                className="diagramm-zone"
                tabIndex={0}
                role="button"
                aria-label={`Werte vom ${datumDeutsch(z.art === 'punkt' ? mitZeit[z.i].datum : fehlend[z.i].datum)}`}
                onMouseEnter={() => setAktiv(i)}
                onMouseLeave={() => setAktiv(null)}
                onFocus={() => setAktiv(i)}
                onBlur={() => setAktiv(null)}
              />
              {aktiv === i && <rect x={x(z.m) - 20} y={R.oben + 2} width={40} height={unten - R.oben - 4} rx={8} className="diagramm-fokus" />}
            </g>
          ),
        )}
      </svg>

      {info && info.m !== null && (
        <div
          className="diagramm-fenster"
          role="status"
          style={x(info.m) + 260 > B ? { right: B - x(info.m) + 26 } : { left: x(info.m) + 26 }}
        >
          {info.art === 'fehlt' ? (
            <>
              <span className="diagramm-fenster-datum">{datumDeutsch(fehlend[info.i].datum)}</span>
              <dl>
                <dt>Phase</dt>
                <dd>{fehlend[info.i].phase}</dd>
              </dl>
              <AmpelMarke ampel={null} text="nicht gemessen" />
            </>
          ) : (
            <>
              <span className="diagramm-fenster-datum">{datumDeutsch(mitZeit[info.i].datum)}</span>
              <dl>
                <dt>Phase</dt>
                <dd>{mitZeit[info.i].phase}</dd>
                <dt>Monate seit OP</dt>
                <dd>{zahl(mitZeit[info.i].monate!, 0)}</dd>
                {reihen.map((r, ri) => (
                  <div key={r.name} className="diagramm-fenster-zeile">
                    <dt>{r.name}</dt>
                    <dd>{mitZeit[info.i].werte[ri] === null ? '–' : `${zahl(mitZeit[info.i].werte[ri]!, nachkomma)} ${einheit}`}</dd>
                  </div>
                ))}
              </dl>
              {mitZeit[info.i].ampel && <AmpelMarke ampel={mitZeit[info.i].ampel} text={`${bewertet ? `${bewertet}: ` : ""}${AMPEL_TEXT[mitZeit[info.i].ampel!]}`} />}
            </>
          )}
        </div>
      )}

      <p className="diagramm-legende">
        {reihen.map((r) => (
          <span key={r.name}>
            <i style={r.gestrichelt ? { height: 0, borderTop: `2px dashed ${r.farbe}` } : { background: r.farbe }} /> {r.name}
          </span>
        ))}
        {korridor && (
          <span>
            <i className="diagramm-legende-korridor" /> {korridor.text}
          </span>
        )}
        {punkte.some((p) => p.ampel) && <span>Punkte: ✓ erfüllt · ~ knapp · ✗ nicht erfüllt</span>}
        {fehlend.length > 0 && <span>○ nicht gemessen</span>}
        {!korridor && hinweis && <span>{hinweis}</span>}
      </p>
      {punkte.length < 2 && <p className="diagramm-hinweis">Erst eine Messung – der Verlauf entsteht ab zwei Testungen.</p>}
    </figure>
  )
}
