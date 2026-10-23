import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { BEREICHE, HINWEIS } from './navigation'
import PatientenListe from './pages/PatientenListe'
import PatientFormular from './pages/PatientFormular'
import Platzhalter from './pages/Platzhalter'

const logoUrl = `${import.meta.env.BASE_URL}logo-pzl.svg`

export default function App() {
  return (
    <div className="app">
      <header className="kopf">
        <div className="kopf-logo-platte">
          <img className="kopf-logo" src={logoUrl} alt="Physio Zentrum Linz" />
        </div>
        <div className="kopf-text">
          <h1 className="kopf-titel">
            <span className="kopf-titel-pzl">PZL</span> Return-to-Sport
          </h1>
          <p className="kopf-unterzeile">VKB-Testbatterie · Physio Zentrum Linz</p>
        </div>
        <div className="kopf-streifen" aria-hidden="true" />
      </header>

      <nav className="navigation" aria-label="Hauptnavigation">
        {BEREICHE.map((b) => (
          <NavLink key={b.pfad} to={b.pfad} className="nav-link">
            <span>{b.titel}</span>
          </NavLink>
        ))}
      </nav>

      <main className="inhalt">
        <Routes>
          <Route path="/" element={<Navigate to="/patienten" replace />} />
          <Route path="/patienten" element={<PatientenListe />} />
          <Route path="/patienten/neu" element={<PatientFormular key="neu" />} />
          <Route path="/patienten/:id" element={<PatientFormular />} />
          {BEREICHE.filter((b) => b.etappe).map((b) => (
            <Route key={b.pfad} path={b.pfad} element={<Platzhalter bereich={b} />} />
          ))}
          <Route path="*" element={<Navigate to="/patienten" replace />} />
        </Routes>
      </main>

      <footer className="hinweis" role="note">
        {HINWEIS}
      </footer>
    </div>
  )
}
