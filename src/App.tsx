import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import DarstellungUmschalter from './Darstellung'
import { KATALOG_FEHLER } from './katalog'
import { BEREICHE, HINWEIS } from './navigation'
import Bericht from './pages/Bericht'
import BerichteListe from './pages/BerichteListe'
import Info from './pages/Info'
import PatientenListe from './pages/PatientenListe'
import PatientFormular from './pages/PatientFormular'
import Platzhalter from './pages/Platzhalter'
import Start from './pages/Start'
import TestungErfassen from './pages/TestungErfassen'
import TestungListe from './pages/TestungListe'

const logoUrl = `${import.meta.env.BASE_URL}logo-pzl.svg`

export default function App() {
  const { pathname } = useLocation()
  const startseite = pathname === '/'
  const breit = pathname.startsWith('/testung/')

  return (
    <div className="app">
      <header className="kopf">
        {/* Startseite zeigt das Logo groß in der Mitte – dort nur die Navigation */}
        {!startseite && (
          <Link to="/" className="kopf-marke" aria-label="Zur Startseite">
            <span className="kopf-logo-chip">
              <img className="kopf-logo" src={logoUrl} alt="Physio Zentrum Linz" />
            </span>
            <span className="kopf-titel">
              <span className="kopf-titel-pzl">PZL</span> Return-to-Sport
            </span>
          </Link>
        )}

        <nav className="navigation" aria-label="Hauptnavigation">
          {BEREICHE.map((b) => (
            <NavLink key={b.pfad} to={b.pfad} end={b.pfad === '/'} className="nav-link">
              {b.titel}
            </NavLink>
          ))}
        </nav>
        <DarstellungUmschalter />
      </header>

      {/* Prüfung beim Start: fehlerhafte Konfiguration sofort sichtbar machen */}
      {KATALOG_FEHLER.length > 0 && (
        <div className="konfig-fehler" role="alert">
          <strong>Achtung: Der Testkatalog (config/) ist fehlerhaft – Bewertungen sind nicht verlässlich.</strong> Bitte Philipp melden.
          <ul>
            {KATALOG_FEHLER.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <main className={`inhalt${startseite ? ' inhalt-voll' : breit ? ' inhalt-breit' : ''}`}>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/patienten" element={<PatientenListe />} />
          <Route path="/patienten/neu" element={<PatientFormular key="neu" />} />
          <Route path="/patienten/:id" element={<PatientFormular />} />
          <Route path="/info" element={<Info />} />
          <Route path="/testung" element={<TestungListe />} />
          <Route path="/testung/:id" element={<TestungErfassen />} />
          <Route path="/berichte" element={<BerichteListe />} />
          <Route path="/berichte/:id/:art" element={<Bericht />} />
          {BEREICHE.filter((b) => b.etappe).map((b) => (
            <Route key={b.pfad} path={b.pfad} element={<Platzhalter bereich={b} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="hinweis" role="note">
        {HINWEIS}
      </footer>
    </div>
  )
}
