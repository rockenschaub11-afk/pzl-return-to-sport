// Einfaches Liniendiagramm als SVG (ENTSCHEIDUNGEN Technik: eigene SVG-Grafiken, keine fremde Lizenz).

import { datumDeutsch } from '../patienten/stammdaten'

export interface Reihe {
  name: string
  farbe: string
  /** gestrichelt – damit die Linien auch in Schwarz-Weiß unterscheidbar sind */
  gestrichelt?: boolean
}

export interface Band {
  name: string
  von: Date
  bis: Date | null
}

interface Props {
  titel: string
  punkte: { datum: string; werte: (number | null)[] }[]
  reihen: Reihe[]
  einheit: string
  ziel?: { wert: number; text: string }
  baender: Band[]
  /** Achse ab 0 beginnen (Kraft, Höhe) – sonst um die Werte herum (LSI) */
  abNull?: boolean
}

const B = 640
const H = 220
const R = { links: 48, rechts: 16, oben: 22, unten: 34 }

/** schöne Achsenteilung mit 4–6 Strichen */
function teilung(min: number, max: number): number[] {
  const spanne = max - min || Math.abs(max) || 1
  const roh = spanne / 5
  const zehner = Math.pow(10, Math.floor(Math.log10(roh)))
  const schritt = [1, 2, 2.5, 5, 10].map((f) => f * zehner).find((s) => s >= roh) ?? 10 * zehner
  const start = Math.floor(min / schritt) * schritt
  const striche: number[] = []
  for (let v = start; v <= max + schritt * 0.5; v += schritt) striche.push(Math.round(v * 1000) / 1000)
  return striche
}

const zahl = (v: number) => v.toLocaleString('de-AT', { maximumFractionDigits: 1 })

export default function LinienDiagramm({ titel, punkte, reihen, einheit, ziel, baender, abNull = true }: Props) {
  const zeiten = punkte.map((p) => new Date(`${p.datum}T12:00:00`).getTime())
  const tag = 86_400_000
  const xMin = Math.min(...zeiten) - 14 * tag
  const xMax = Math.max(...zeiten) + 14 * tag
  const alle = punkte.flatMap((p) => p.werte).filter((w): w is number => w !== null)
  if (ziel) alle.push(ziel.wert)
  const lo = abNull ? 0 : Math.min(...alle) - 5
  const hi = Math.max(...alle) * (abNull ? 1.1 : 1) + (abNull ? 0 : 5)
  const striche = teilung(lo, hi)
  const yMin = striche[0]
  const yMax = striche[striche.length - 1]
  const x = (t: number) => R.links + ((t - xMin) / (xMax - xMin)) * (B - R.links - R.rechts)
  const y = (v: number) => R.oben + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - R.oben - R.unten)

  return (
    <figure className="diagramm">
      <figcaption>{titel}</figcaption>
      <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label={titel}>
        {baender.map((b, i) => {
          const von = Math.max(b.von.getTime(), xMin)
          const bis = Math.min(b.bis?.getTime() ?? xMax, xMax)
          if (bis <= von) return null
          return (
            <g key={b.name}>
              <rect x={x(von)} y={R.oben} width={x(bis) - x(von)} height={H - R.oben - R.unten} className={`diagramm-band diagramm-band-${i % 2}`} />
              <text x={(x(von) + x(bis)) / 2} y={R.oben - 6} className="diagramm-band-text">
                {b.name}
              </text>
            </g>
          )
        })}

        {striche.map((s) => (
          <g key={s}>
            <line x1={R.links} x2={B - R.rechts} y1={y(s)} y2={y(s)} className="diagramm-raster" />
            <text x={R.links - 6} y={y(s) + 4} className="diagramm-achse diagramm-achse-y">
              {zahl(s)}
            </text>
          </g>
        ))}
        <text x={4} y={R.oben - 6} className="diagramm-achse">
          {einheit}
        </text>

        {ziel && (
          <g>
            <line x1={R.links} x2={B - R.rechts} y1={y(ziel.wert)} y2={y(ziel.wert)} className="diagramm-ziel" />
            <text x={B - R.rechts} y={y(ziel.wert) - 5} className="diagramm-ziel-text">
              {ziel.text}
            </text>
          </g>
        )}

        {reihen.map((r, ri) => {
          const pts = punkte.map((p, i) => ({ t: zeiten[i], v: p.werte[ri], datum: p.datum })).filter((p): p is { t: number; v: number; datum: string } => p.v !== null)
          return (
            <g key={r.name}>
              <polyline points={pts.map((p) => `${x(p.t)},${y(p.v)}`).join(' ')} fill="none" style={{ stroke: r.farbe }} strokeWidth={2.5} strokeDasharray={r.gestrichelt ? '7 4' : undefined} />
              {pts.map((p) => (
                <circle key={p.datum} cx={x(p.t)} cy={y(p.v)} r={4.5} style={{ fill: 'var(--flaeche)', stroke: r.farbe }} strokeWidth={2.5}>
                  <title>{`${r.name} ${datumDeutsch(p.datum)}: ${zahl(p.v)} ${einheit}`}</title>
                </circle>
              ))}
            </g>
          )
        })}

        {punkte.map((p, i) => (
          <text key={p.datum + i} x={x(zeiten[i])} y={H - 12} className="diagramm-achse diagramm-achse-x">
            {datumDeutsch(p.datum).slice(0, 6)}
            {p.datum.slice(2, 4)}
          </text>
        ))}
      </svg>
      {reihen.length > 1 && (
        <p className="diagramm-legende">
          {reihen.map((r) => (
            <span key={r.name}>
              <i style={r.gestrichelt ? { height: 0, borderTop: `3px dashed ${r.farbe}` } : { background: r.farbe }} /> {r.name}
            </span>
          ))}
        </p>
      )}
    </figure>
  )
}
