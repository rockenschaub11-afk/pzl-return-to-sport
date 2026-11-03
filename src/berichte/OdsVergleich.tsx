// ODS-Seitenvergleich als eigenes SVG (Visualisierung Stufe 1, Konzept C2) – gleiche Bauart wie die LSI-Übersicht:
// je Wert eine Zeile mit gesund | betroffen, Punkt = betroffen in % von gesund, gruppiert nach Output, Driver, Strategy.
// Farbe nur beim Sprunghöhe-LSI (Ziel aus dem Katalog), sonst grau ohne Bewertung. Zeiten in Worten („betroffen länger“).

import { MELOQ } from '../katalog/meloq'
import { AMPEL_ZEICHEN, zeitVergleich } from './bericht'
import type { OdsVergleich as Vergleich, OdsZeile } from './odsZeilen'

const B = 815
const OBEN = 20
const X0 = 355
const X1 = 615
const SPALTE = { gesund: 236, betroffen: 306, wert: 629 }

const prozent = (v: number) => `${v.toLocaleString('de-AT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
const zahl = (v: number | null, nachkomma: number) => (v === null ? '–' : v.toLocaleString('de-AT', { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma }))
const mitEinheit = (z: OdsZeile, v: number | null) => `${zahl(v, z.nachkomma)}${z.einheit ? ` ${z.einheit}` : ''}`
const vergleichText = (z: OdsZeile) => (z.lsi === null ? '–' : z.zeit ? zeitVergleich(z.lsi) : `LSI ${prozent(z.lsi)}`)

export default function OdsVergleich({ vergleich, zeile: ZEILE = 17 }: { vergleich: Vergleich; zeile?: number }) {
  // Zeilen plus je ODS-Gruppe eine Kopfzeile
  const reihen: ({ art: 'kopf'; ods: OdsZeile['ods'] } | { art: 'wert'; z: OdsZeile })[] = []
  let gruppe: OdsZeile['ods'] | null = null
  for (const z of vergleich.zeilen) {
    if (z.ods !== gruppe) reihen.push({ art: 'kopf', ods: z.ods })
    gruppe = z.ods
    reihen.push({ art: 'wert', z })
  }
  const H = OBEN + reihen.length * ZEILE + 6
  const alle = vergleich.zeilen.flatMap((z) => (z.lsi === null ? [] : [z.lsi]))
  const LO = Math.min(70, Math.floor(Math.min(...alle) / 10) * 10)
  const HI = Math.max(130, Math.ceil(Math.max(...alle) / 10) * 10)
  const TICKS = Array.from({ length: (HI - LO) / 10 + 1 }, (_, i) => LO + i * 10)
  const x = (v: number) => X0 + ((v - LO) / (HI - LO)) * (X1 - X0)
  const mitZeit = vergleich.zeilen.some((z) => z.zeit)

  return (
    <figure className="lsi-uebersicht ods-vergleich">
      <svg
        viewBox={`0 0 ${B} ${H}`}
        role="img"
        aria-label={`${vergleich.name}, Output, Driver und Strategy: ${vergleich.zeilen
          .map((z) => `${MELOQ.ods[z.ods].name} ${z.name}: gesund ${mitEinheit(z, z.gesund)}, betroffen ${mitEinheit(z, z.betroffen)}, ${vergleichText(z)}${z.ampel ? ` ${AMPEL_ZEICHEN[z.ampel]}` : ''}`)
          .join('; ')}`}
      >
        <line x1={x(100)} x2={x(100)} y1={OBEN - 4} y2={H - 2} className="lsi-raster lsi-raster-100" />
        {TICKS.map((t) => (
          <g key={t}>
            {t !== 100 && <line x1={x(t)} x2={x(t)} y1={OBEN - 4} y2={H - 2} className="lsi-raster" />}
            <text x={x(t)} y={11} textAnchor="middle" className="lsi-text">
              {TICKS.length > 9 && t % 20 !== 0 ? '' : `${t} %`}
            </text>
          </g>
        ))}
        <text x={SPALTE.gesund} y={11} textAnchor="end" className="lsi-text">
          gesund
        </text>
        <text x={SPALTE.betroffen} y={11} textAnchor="end" className="lsi-text">
          betroffen
        </text>
        {reihen.map((r, i) => {
          const y = OBEN + i * ZEILE + ZEILE / 2
          if (r.art === 'kopf') {
            return (
              <text key={`k-${r.ods}`} x={0} y={y + 4} className="ods-kopf">
                {MELOQ.ods[r.ods].name} <tspan className="lsi-text">· {MELOQ.ods[r.ods].kurz}</tspan>
              </text>
            )
          }
          const z = r.z
          return (
            <g key={z.id} className="lsi-zeile">
              <rect x={0} y={OBEN + i * ZEILE} width={B} height={ZEILE} className="lsi-treffer" />
              <text x={10} y={y + 3.5} className="lsi-name">
                {z.name}
              </text>
              <text x={SPALTE.gesund} y={y + 3.5} textAnchor="end" className="lsi-text lsi-seite">
                {mitEinheit(z, z.gesund)}
              </text>
              <text x={SPALTE.betroffen} y={y + 3.5} textAnchor="end" className="lsi-name lsi-seite">
                {mitEinheit(z, z.betroffen)}
              </text>
              {z.ziel !== null && <line x1={x(z.ziel)} x2={x(z.ziel)} y1={y - 6} y2={y + 6} className="ods-ziel" />}
              {z.lsi !== null && <circle cx={x(Math.min(Math.max(z.lsi, LO), HI))} cy={y} r={4.6} className={`lsi-punkt${z.ampel ? ` lsi-${z.ampel}` : ''}`} />}
              <text x={SPALTE.wert} y={y + 3.5} className={z.zeit ? 'lsi-text' : 'lsi-name lsi-wert'}>
                {vergleichText(z)}
                {z.ampel && <tspan className={`lsi-zeichen lsi-${z.ampel}`}> {AMPEL_ZEICHEN[z.ampel]}</tspan>}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="bericht-legende">
        <span>● betroffen in % von gesund (100 % = gleich)</span>
        <span>Farbe und │ Ziel nur bei der Sprunghöhe, sonst ohne Bewertung</span>
        {mitZeit && <span>Zeiten: über 100 % = betroffen braucht länger</span>}
      </figcaption>
    </figure>
  )
}

/** Satz zur Einordnung – aus config/meloq.json, nichts Neues. */
export function OdsHinweis() {
  return (
    <p className="ods-hinweis">
      {MELOQ.odsHinweis} <span className="kat-quelle">Quelle: {MELOQ.odsQuelle}</span>
    </p>
  )
}
