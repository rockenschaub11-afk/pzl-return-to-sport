// Fängt Fehler beim Anzeigen ab, damit statt einer leeren Seite ein Ausweg bleibt (Web-Interface-Audit K3).
// Keine Daten im Fehlertext: die Meldung kann Werte enthalten und wird nirgends gesendet oder gespeichert.

import { Component, type ErrorInfo, type ReactNode } from 'react'

export default class Auffangnetz extends Component<{ children: ReactNode }, { fehler: boolean }> {
  state = { fehler: false }

  static getDerivedStateFromError() {
    return { fehler: true }
  }

  componentDidCatch(fehler: Error, info: ErrorInfo) {
    console.error(fehler, info.componentStack)
  }

  render() {
    if (!this.state.fehler) return this.props.children
    return (
      <div className="auffangnetz" role="alert">
        <h1>Die Seite konnte nicht angezeigt werden</h1>
        <p>Bereits gespeicherte Eingaben bleiben auf diesem Laptop erhalten. Lade die Seite neu; hilft das nicht, gehe zurück zur Startseite.</p>
        <div className="aktionen">
          <button type="button" className="knopf knopf-haupt" onClick={() => window.location.reload()}>
            <span>Seite neu laden</span>
          </button>
          <a
            className="knopf"
            href="#/"
            onClick={() => {
              window.location.hash = '#/'
              window.location.reload()
            }}
          >
            <span>Zur Startseite</span>
          </a>
        </div>
      </div>
    )
  }
}
