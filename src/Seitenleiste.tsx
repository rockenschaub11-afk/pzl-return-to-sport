// Seitenleiste links, auf dem Handy Leiste unten mit „Mehr“ (docs/DESIGNKONZEPT.md 5, 10.8).
// Inhalt der Navigation unverändert aus BEREICHE.

import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import DarstellungUmschalter from './Darstellung'
import { BEREICHE } from './navigation'

const logoUrl = `${import.meta.env.BASE_URL}logo-pzl.svg`

/** Eigene Symbole (24 × 24, Linie) – keine fremde Symbol-Bibliothek. */
const SYMBOLE: Record<string, ReactNode> = {
  '/': <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />,
  '/patienten': (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 14.2c2.9.2 5 2.4 5 5.8" />
    </>
  ),
  '/testung': (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 13V9M10 2.5h4M18.5 6.5l1.5-1.5" />
    </>
  ),
  '/berichte': (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  '/sicherung': (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  '/info': (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
}

const MEHR = (
  <>
    <circle cx="5" cy="12" r="1.3" />
    <circle cx="12" cy="12" r="1.3" />
    <circle cx="19" cy="12" r="1.3" />
  </>
)

/** Auf dem Handy direkt in der Leiste unten – der Rest kommt unter „Mehr“. */
const HANDY_LEISTE = ['/', '/patienten', '/testung', '/berichte']

function Symbol({ children }: { children: ReactNode }) {
  return (
    <svg className="leiste-symbol" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

export default function Seitenleiste({ mitLogo }: { mitLogo: boolean }) {
  const { pathname } = useLocation()
  const [mehrOffen, setMehrOffen] = useState(false)
  // Menü „Mehr“ schließt sich beim Seitenwechsel
  useEffect(() => setMehrOffen(false), [pathname])

  return (
    <aside className="leiste">
      {mitLogo ? (
        <Link to="/" className="leiste-logo" aria-label="Zur Startseite">
          <img src={logoUrl} alt="Physio Zentrum Linz" />
        </Link>
      ) : (
        <span className="leiste-logo-platz" />
      )}

      <nav className="leiste-nav" aria-label="Hauptnavigation">
        {BEREICHE.map((b) => (
          <NavLink key={b.pfad} to={b.pfad} end={b.pfad === '/'} className={`leiste-link${HANDY_LEISTE.includes(b.pfad) ? '' : ' nur-breit'}`}>
            <Symbol>{SYMBOLE[b.pfad]}</Symbol>
            <span aria-hidden={b.kurz ? true : undefined}>{b.kurz ?? b.titel}</span>
            {b.kurz && <span className="sr-only">{b.titel}</span>}
          </NavLink>
        ))}
        <button type="button" className="leiste-link leiste-mehr" aria-expanded={mehrOffen} aria-controls="leiste-mehr" onClick={() => setMehrOffen((o) => !o)}>
          <Symbol>{MEHR}</Symbol>
          <span>Mehr</span>
        </button>
      </nav>

      <div className="leiste-unten">
        <DarstellungUmschalter />
      </div>

      {mehrOffen && (
        <div className="leiste-mehr-menue" id="leiste-mehr">
          {BEREICHE.filter((b) => !HANDY_LEISTE.includes(b.pfad)).map((b) => (
            <Link key={b.pfad} to={b.pfad}>
              {b.titel}
            </Link>
          ))}
          <DarstellungUmschalter />
        </div>
      )}
    </aside>
  )
}
