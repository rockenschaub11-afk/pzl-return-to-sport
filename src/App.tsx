import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { BEREICHE, HINWEIS } from './navigation'
import Platzhalter from './pages/Platzhalter'

const logoUrl = `${import.meta.env.BASE_URL}logo-pzl.svg`

export default function App() {
  return (
    <div className="app">
      <header className="kopf">
        <img className="kopf-logo" src={logoUrl} alt="Physio Zentrum Linz" />
        <h1 className="kopf-titel">PZL Return-to-Sport</h1>
      </header>

      <nav className="navigation" aria-label="Hauptnavigation">
        {BEREICHE.map((b) => (
          <NavLink key={b.pfad} to={b.pfad} className="nav-link">
            {b.titel}
          </NavLink>
        ))}
      </nav>

      <main className="inhalt">
        <Routes>
          <Route path="/" element={<Navigate to={BEREICHE[0].pfad} replace />} />
          {BEREICHE.map((b) => (
            <Route key={b.pfad} path={b.pfad} element={<Platzhalter bereich={b} />} />
          ))}
          <Route path="*" element={<Navigate to={BEREICHE[0].pfad} replace />} />
        </Routes>
      </main>

      <footer className="hinweis" role="note">
        {HINWEIS}
      </footer>
    </div>
  )
}
