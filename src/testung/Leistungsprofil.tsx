// Leistungsprofil (Visualisierung Stufe 2, Konzept E): je Absolut-Kriterium ein schmaler Balken ab 0 in der Einheit des Tests –
// Zielbereich wie der Korridor im Verlauf, Strich = Schwelle der Phase, Punkt = Wert in der Ampelfarbe. Kein Gesamtwert.

import { einheitFest } from './erfassung'
import { AmpelMarke } from './Ladebalken'
import type { leistungsprofil, ProfilZeile } from './profil'

const B = 160
const H = 14
const zahl = (v: number, nachkomma: number) => v.toLocaleString('de-AT', { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma })
const ZEICHEN = { '>': '>', '>=': '≥', '<': '<', '<=': '≤' } as const
const FARBE = { gruen: 'var(--erfuellt)', gelb: 'var(--knapp)', rot: 'var(--nicht-erfuellt)' } as const

function Balken({ z }: { z: ProfilZeile }) {
  const max = Math.max(z.wert, z.schwelle) * 1.25 || 1
  const x = (v: number) => (Math.min(Math.max(v, 0), max) / max) * B
  const oben = z.vergleich === '>' || z.vergleich === '>='
  return (
    <svg viewBox={`0 0 ${B} ${H}`} width={B} height={H} className="profil-balken" aria-hidden="true">
      <rect x={0} y={H / 2 - 2} width={B} height={4} rx={2} className="profil-spur" />
      <rect x={oben ? x(z.schwelle) : 0} y={1} width={oben ? B - x(z.schwelle) : x(z.schwelle)} height={H - 2} className="lsi-korridor" />
      <line x1={x(z.schwelle)} x2={x(z.schwelle)} y1={0} y2={H} className="diagramm-ziel" />
      <circle cx={x(z.wert)} cy={H / 2} r={4.5} style={{ fill: z.ampel ? FARBE[z.ampel] : 'var(--text-sehr-leise)' }} />
    </svg>
  )
}

export default function Leistungsprofil({ bloecke }: { bloecke: ReturnType<typeof leistungsprofil> }) {
  return (
    <div className="profil">
      {bloecke.map((b) => (
        <div key={b.block} className="profil-block">
          <h3 className="abdeckung-block-titel">{b.name}</h3>
          {b.zeilen.map((z) => {
            const e = z.einheit === '%' ? ' %' : z.einheit ? ` ${z.einheit}` : ''
            const abstand = `${z.abstand > 0 ? '+' : z.abstand < 0 ? '−' : '±'}${zahl(Math.abs(z.abstand), z.nachkomma)}${e}`
            return (
              <div key={z.id} className="profil-zeile">
                <span className="profil-name">
                  {z.test}
                  <small>
                    {z.kriterium}
                    {z.status !== 'Pflicht' && ` · ${z.status}`}
                  </small>
                </span>
                <span className="profil-wert">{einheitFest(`${zahl(z.wert, z.nachkomma)}${e}`)}</span>
                <span className="profil-ziel">
                  {einheitFest(`Ziel ${ZEICHEN[z.vergleich]} ${zahl(z.schwelle, z.nachkomma)}${e}`)}
                  {z.uebernommen && <small> (aus früherer Phase)</small>}
                </span>
                <Balken z={z} />
                <span className="profil-abstand">{einheitFest(abstand)}</span>
                <AmpelMarke ampel={z.ampel} text={z.ampel ? (z.status === 'Warnung' && z.ampel === 'gelb' ? 'Warnung' : undefined) : 'Info'} />
              </div>
            )
          })}
        </div>
      ))}
      <p className="diagramm-legende">
        <span>Abstand = Wert − Schwelle der Phase, in der Einheit des Tests (nicht zwischen Tests vergleichbar)</span>
        <span>
          <i className="diagramm-legende-korridor" /> Zielbereich · │ Schwelle · Balken beginnt bei 0
        </span>
      </p>
    </div>
  )
}
