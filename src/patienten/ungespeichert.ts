// Warnt, bevor ungespeicherte Stammdaten verloren gehen (Web-Interface-Audit H3).
// HashRouter kennt keinen Navigations-Wächter, darum: Klicks auf Links abfangen, dazu beforeunload fürs Schließen.

import { useEffect } from 'react'

const FRAGE = 'Die Änderungen an den Stammdaten sind noch nicht gespeichert. Seite trotzdem verlassen?'

export function useUngespeichertWarnung(aktiv: boolean) {
  useEffect(() => {
    if (!aktiv) return
    const vorSchliessen = (e: BeforeUnloadEvent) => e.preventDefault()
    const vorLink = (e: MouseEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest('a[href]')) return
      if (window.confirm(FRAGE)) return
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('beforeunload', vorSchliessen)
    document.addEventListener('click', vorLink, true)
    return () => {
      window.removeEventListener('beforeunload', vorSchliessen)
      document.removeEventListener('click', vorLink, true)
    }
  }, [aktiv])
}
