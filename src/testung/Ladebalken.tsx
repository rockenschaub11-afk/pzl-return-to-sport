import type { Ampel } from '../rechnen/bewertung'

export const AMPEL_TEXT: Record<Ampel, string> = { gruen: 'erfüllt', gelb: 'knapp', rot: 'nicht erfüllt' }

/** Ladebalken mit Zielmarke (DESIGNKONZEPT 10.6): Skala 0–120 %, feiner Strich bei 100 %, Werte darüber am Rand mit „›“. */
const SKALA = 120
const pos = (w: number) => `${(Math.min(Math.max(w, 0), SKALA) / SKALA) * 100}%`

export default function Ladebalken({ wert, ziel, ampel }: { wert: number; ziel: number; ampel: Ampel }) {
  return (
    <div className={`ladebalken ampel-${ampel}`} role="img" aria-label={`${wert.toLocaleString('de-AT')} % – ${AMPEL_TEXT[ampel]}, Ziel ${ziel} %`}>
      <div className="ladebalken-spur">
        <div className="ladebalken-fuellung" style={{ width: pos(wert) }} />
        <div className="ladebalken-100" style={{ left: pos(100) }} />
        <div className="ladebalken-ziel" style={{ left: pos(ziel) }} title={`Ziel ${ziel} %`} />
        {wert > SKALA && <span className="ladebalken-mehr">›</span>}
      </div>
    </div>
  )
}

export function AmpelMarke({ ampel, text }: { ampel: Ampel | null; text?: string }) {
  if (!ampel) return <span className="ampel-marke ampel-offen">{text ?? 'offen'}</span>
  return <span className={`ampel-marke ampel-${ampel}`}>{text ?? AMPEL_TEXT[ampel]}</span>
}
