import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BEREICHE, HINWEIS } from './navigation'
import PatientenListe from './pages/PatientenListe'
import PatientFormular from './pages/PatientFormular'
import Platzhalter from './pages/Platzhalter'
import Start from './pages/Start'

const logoUrl = `${import.meta.env.BASE_URL}logo-pzl.svg`

export default function App() {
  const { pathname } = useLocation()
  const startseite = pathname === '/'

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
      </header>

      <main className={`inhalt${startseite ? ' inhalt-voll' : ''}`}>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/patienten" element={<PatientenListe />} />
          <Route path="/patienten/neu" element={<PatientFormular key="neu" />} />
          <Route path="/patienten/:id" element={<PatientFormular />} />
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
