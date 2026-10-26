import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BEISPIEL_KUERZEL, beispielAnlegen, beispielLoeschen } from '../beispiel'
import { db } from '../db'

/** Beispiel-Pat. zum Durchklicken und Einschulen (Einstellungen/Info). */
export default function BeispielKarte() {
  const navigate = useNavigate()
  const vorhanden = useLiveQuery(() => db.patienten.where('kuerzelNorm').equals(BEISPIEL_KUERZEL).first(), [])
  const [fragen, setFragen] = useState(false)

  return (
    <div className="karte kat-regeln">
      <h3>Beispiel-Pat. zum Ausprobieren</h3>
      <p>
        Legt das Fantasie-Kürzel <strong>{BEISPIEL_KUERZEL}</strong> an (männlich, Fußball, OP vor 12 Monaten) mit einem Verlaufstest „Mitte“ und
        „Spät“ (abgeschlossen) und einer fast fertigen Endtestung (in Arbeit) – ideal für Verlauf, RTS-Vorschlag und Entscheidung. Keine echten Daten.
      </p>
      {vorhanden ? (
        <div className="aktionen">
          <button type="button" className="knopf knopf-haupt" onClick={() => navigate(`/patienten/${vorhanden.id}`)}>
            <span>{BEISPIEL_KUERZEL} öffnen</span>
          </button>
          {!fragen ? (
            <button type="button" className="knopf knopf-gefahr" onClick={() => setFragen(true)}>
              <span>Beispiel löschen …</span>
            </button>
          ) : (
            <>
              <button type="button" className="knopf knopf-gefahr" onClick={() => beispielLoeschen().then(() => setFragen(false))}>
                <span>Ja, {BEISPIEL_KUERZEL} löschen</span>
              </button>
              <button type="button" className="knopf" onClick={() => setFragen(false)}>
                <span>Abbrechen</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <button type="button" className="knopf knopf-haupt" onClick={async () => navigate(`/patienten/${await beispielAnlegen()}`)}>
          <span>Beispiel-Pat. anlegen</span>
        </button>
      )}
    </div>
  )
}
