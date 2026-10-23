import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
// Schriften liegen in der App selbst (kein Google-Server) → funktioniert offline und ohne Datenweitergabe
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700-italic.css'
import '@fontsource/barlow-condensed/800-italic.css'
import App from './App'
import { dauerhaftenSpeicherAnfragen } from './db'
import './styles.css'

dauerhaftenSpeicherAnfragen()

// HashRouter: Adressen wie „…/#/testung“ funktionieren auf GitHub Pages ohne Server-Einstellungen.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
