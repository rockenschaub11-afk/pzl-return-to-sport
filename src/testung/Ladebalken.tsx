import type { Ampel } from '../rechnen/bewertung'

export const AMPEL_TEXT: Record<Ampel, string> = { gruen: 'erfüllt', gelb: 'knapp', rot: 'nicht erfüllt' }

/** Ampel als gerader Ladebalken mit Zielmarke (ENTSCHEIDUNGEN 10a, D4). Skala 0–100 %. */
export default function Ladebalken({ wert, ziel, ampel }: { wert: number; ziel: number; ampel: Ampel }) {
  return (
    <div className={`ladebalken ampel-${ampel}`} role="img" aria-label={`${wert.toLocaleString('de-AT')} % – ${AMPEL_TEXT[ampel]}, Ziel ${ziel} %`}>
      <div className="ladebalken-spur">
        <div className="ladebalken-fuellung" style={{ width: `${Math.min(Math.max(wert, 0), 100)}%` }} />
        <div className="ladebalken-ziel" style={{ left: `${ziel}%` }} title={`Ziel ${ziel} %`} />
      </div>
    </div>
  )
}

export function AmpelMarke({ ampel, text }: { ampel: Ampel | null; text?: string }) {
  if (!ampel) return <span className="ampel-marke ampel-offen">{text ?? 'offen'}</span>
  return <span className={`ampel-marke ampel-${ampel}`}>{text ?? AMPEL_TEXT[ampel]}</span>
}
