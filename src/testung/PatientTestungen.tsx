import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db, neueTestung } from '../db'
import { KATALOG } from '../katalog'
import { datumDeutsch, isoDatum } from '../patienten/stammdaten'
import { ART_TEXT, fortschritt, monateBisTestung, phaseAusMonaten, phasenStand, statusText } from './ablauf'

/** Neue Testung mit Phase aus OP-Datum und heutigem Datum anlegen und öffnen. */
export function useNeueTestung(patientId: string) {
  const navigate = useNavigate()
  return async () => {
    // Klick kann vor dem Laden des Kürzels kommen – deshalb direkt nachlesen
    const p = await db.patienten.get(patientId)
    if (!p) return
    const heute = isoDatum(new Date())
    const phase = phaseAusMonaten(monateBisTestung(p.opDatum, heute) ?? 0)
    navigate(`/testung/${await neueTestung(patientId, heute, phase)}`)
  }
}

/** Testungen eines Kürzels (Reiter „Testungen“ der Kürzel-Seite). */
export default function PatientTestungen({ patientId, mitKnopf = true }: { patientId: string; mitKnopf?: boolean }) {
  const starten = useNeueTestung(patientId)
  const testungen = useLiveQuery(
    () => db.testungen.where('patientId').equals(patientId).reverse().sortBy('datum'),
    [patientId],
  )

  const patient = useLiveQuery(() => db.patienten.get(patientId), [patientId])



  return (
    <div className="karte block">
      <div className="block-kopf">
        <h3 className="block-titel">Testungen</h3>
        {mitKnopf && (
          <button type="button" className="knopf knopf-haupt" onClick={starten}>
            <span>Neue Testung</span>
          </button>
        )}
      </div>
      {testungen && testungen.length > 0 ? (
        <ul className="testung-liste">
          {testungen.map((t) => {
            const ph = phasenStand(t, patient?.opDatum ?? '')
            const f = fortschritt(t, ph.phase)
            return (
              <li key={t.id}>
                <Link to={`/testung/${t.id}`} className="testung-zeile">
                  <span>
                    {ART_TEXT[ph.art]} · {KATALOG.phasen.find((x) => x.id === ph.phase)?.name} · {datumDeutsch(t.datum)}
                  </span>
                  <span className={`status${t.status === 'abgeschlossen' ? '' : ' status-arbeit'}`}>{statusText(t)}</span>
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
