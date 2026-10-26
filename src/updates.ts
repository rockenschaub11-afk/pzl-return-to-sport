// Offline-Betrieb und automatische Updates (Etappe 11, ENTSCHEIDUNGEN F12).
// Die neue Version wird sofort aktiv und die Seite lädt neu – Eingaben sind dann bereits gespeichert
// (Testungen speichern automatisch nach jeder Eingabe).

import { registerSW } from 'virtual:pwa-register'

/** Wie oft eine geöffnete App nach einer neuen Version fragt. */
const PRUEFEN_ALLE_MS = 60 * 60 * 1000

export function updatesEinrichten(): void {
  // Im Entwicklungsserver kein Service Worker – sonst würde der Browser alte Stände festhalten
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registrierung) {
      if (registrierung) setInterval(() => registrierung.update(), PRUEFEN_ALLE_MS)
    },
  })
}
