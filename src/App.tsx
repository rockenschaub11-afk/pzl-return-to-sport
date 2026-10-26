import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { KATALOG_FEHLER } from './katalog'
import { BEREICHE, HINWEIS } from './navigation'
import Seitenleiste from './Seitenleiste'
import Bericht from './pages/Bericht'
import BerichteListe from './pages/BerichteListe'
import Info from './pages/Info'
import PatientenListe from './pages/PatientenListe'
import PatientFormular from './pages/PatientFormular'
import PatientSeite from './pages/PatientSeite'
import Platzhalter from './pages/Platzhalter'
import Start from './pages/Start'
import TestungErfassen from './pages/TestungErfassen'
import TestungListe from './pages/TestungListe'

export default function App() {
  const { pathname } = useLocation()
  const startseite = pathname === '/'
  const breit = pathname.startsWith('/testung/')

  return (
    <div className="app">
      {/* Startseite zeigt das Logo groß in der Mitte – dort nicht in der Leiste */}
      <Seitenleiste mitLogo={!startseite} />

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
          <Route path="/patienten/:id" element={<PatientSeite />} />
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
