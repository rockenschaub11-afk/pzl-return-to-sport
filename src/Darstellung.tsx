// Hell/Dunkel-Umschalter (docs/DESIGNKONZEPT.md 10.9). Die Wahl merkt sich der Browser –
// nur die Darstellung, keine Pat.-Daten, keine Datenbank. index.html setzt sie schon vor dem Start.

import { useState } from 'react'

export type Darstellung = 'dunkel' | 'hell'

export const DARSTELLUNG_SCHLUESSEL = 'pzl-darstellung'

export function gespeicherteDarstellung(): Darstellung {
  try {
    return localStorage.getItem(DARSTELLUNG_SCHLUESSEL) === 'hell' ? 'hell' : 'dunkel'
  } catch {
    return 'dunkel'
  }
}

export function setzeDarstellung(d: Darstellung): void {
  document.documentElement.dataset.theme = d
  try {
    localStorage.setItem(DARSTELLUNG_SCHLUESSEL, d)
  } catch {
    // privater Modus o. Ä. – dann gilt die Wahl nur bis zum Neuladen
  }
}

const MOND = <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
const SONNE = (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </>
)

export default function DarstellungUmschalter() {
  const [aktuell, setAktuell] = useState<Darstellung>(gespeicherteDarstellung)
  const waehle = (d: Darstellung) => {
    setzeDarstellung(d)
    setAktuell(d)
  }
  return (
    <div className="darstellung" role="group" aria-label="Darstellung">
      {(['dunkel', 'hell'] as const).map((d) => (
        <button key={d} type="button" aria-pressed={aktuell === d} aria-label={d === 'dunkel' ? 'Dunkel' : 'Hell'} title={d === 'dunkel' ? 'Dunkel' : 'Hell'} onClick={() => waehle(d)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {d === 'dunkel' ? MOND : SONNE}
          </svg>
        </button>
      ))}
    </div>
  )
}
