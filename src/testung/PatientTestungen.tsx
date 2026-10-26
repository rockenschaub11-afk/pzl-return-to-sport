import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db, neueEndtestung } from '../db'
import { datumDeutsch, isoDatum } from '../patienten/stammdaten'
import { fortschritt, statusText } from './ablauf'

/** Testungen eines Kürzels und Knopf „Neue Endtestung“ (auf der Seite des Kürzels). */
export default function PatientTestungen({ patientId }: { patientId: string }) {
  const navigate = useNavigate()
  const testungen = useLiveQuery(
    () => db.testungen.where('patientId').equals(patientId).reverse().sortBy('datum'),
    [patientId],
  )

  async function starten() {
    navigate(`/testung/${await neueEndtestung(patientId, isoDatum(new Date()))}`)
  }

  return (
    <div className="karte block">
      <div className="block-kopf">
        <h3 className="block-titel">Testungen</h3>
        <button type="button" className="knopf knopf-haupt" onClick={starten}>
          <span>Neue Endtestung</span>
        </button>
      </div>
      {testungen && testungen.length > 0 ? (
        <ul className="testung-liste">
          {testungen.map((t) => {
            const f = fortschritt(t)
            return (
              <li key={t.id}>
                <Link to={`/testung/${t.id}`} className="testung-zeile">
                  <span>Endtestung · {datumDeutsch(t.datum)}</span>
                  <span className={`chip${t.status === 'abgeschlossen' ? ' chip-wettkampf' : ''}`}>{statusText(t)}</span>
                  <span className="testung-fortschritt">
                    {f.erfasst} / {f.gesamt} Tests
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="hinweis-leise">Noch keine Testung.</p>
      )}
    </div>
  )
}
