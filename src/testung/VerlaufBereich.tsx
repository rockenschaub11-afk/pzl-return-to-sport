import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router-dom'
import { db } from '../db'
import { phaseNach } from '../katalog'
import { datumDeutsch, type Patient } from '../patienten/stammdaten'
import LinienDiagramm from './LinienDiagramm'
import { nachBloecken, verfuegbareOptionen } from './verlauf'
import { verlaufsDiagramme } from './verlaufDiagramme'
const zahl = (v: number | null) => (v === null ? '–' : v.toLocaleString('de-AT', { maximumFractionDigits: 1 }))

/** Verlauf über alle Testungen eines Kürzels (Etappe-7-Frage 6). */
export default function VerlaufBereich({ patient }: { patient: Patient }) {
  const testungen = useLiveQuery(() => db.testungen.where('patientId').equals(patient.id).toArray(), [patient.id])
  const [adresse, setAdresse] = useSearchParams()
  const wahl = adresse.get('verlauf') ?? ''
  const setWahl = (w: string) =>
    setAdresse(
      (a) => {
        a.set('verlauf', w)
        return a
      },
      { replace: true },
    )
  if (!testungen) return null

  const optionen = verfuegbareOptionen(patient, testungen)
  if (optionen.length === 0) {
    return (
      <div className="karte block">
        <h2 className="block-titel">Verlauf</h2>
        <p className="hinweis-leise">Sobald Werte erfasst sind, erscheinen hier die Verlaufsdiagramme.</p>
      </div>
    )
  }
  const option = optionen.find((o) => o.id === wahl) ?? optionen.find((o) => o.id === 'hhd_knie_ext') ?? optionen[0]
  const { punkte, diagramme } = verlaufsDiagramme(patient, testungen, option)

  return (
    <div className="karte block verlauf">
      <div className="block-kopf">
        <h2 className="block-titel">Verlauf</h2>
        <label className="feld feld-inline">
          <span className="sr-only">Test für den Verlauf</span>
          <select value={option.id} onChange={(e) => setWahl(e.target.value)}>
            {nachBloecken(optionen).map((g) => (
              <optgroup key={g.name} label={g.name}>
                {g.optionen.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <div className="verlauf-diagramme">
        {diagramme.map((d) => (
          <LinienDiagramm key={d.titel} {...d} />
        ))}
      </div>

      <details className="test-mehr">
        <summary>Werte als Tabelle</summary>
        <table className="eingabe-raster verlauf-tabelle">
          <thead>
            <tr>
              <th scope="col">Datum</th>
              <th scope="col">Phase</th>
              {option.seiten ? (
                <>
                  <th scope="col">gesund</th>
                  <th scope="col">betroffen</th>
                </>
              ) : (
                <th scope="col">Wert</th>
              )}
              {option.zweites && <th scope="col">{option.zweites.name}</th>}
            </tr>
          </thead>
          <tbody>
            {punkte.map((p) => (
              <tr key={p.testungId}>
                <td>{datumDeutsch(p.datum)}</td>
                <td>
                  {phaseNach(p.phase).name}
                  {p.monate !== null && ` (${p.monate} Mo)`}
                </td>
                {option.seiten ? (
                  <>
                    <td>{zahl(p.gesund)}</td>
                    <td>{zahl(p.betroffen)}</td>
                  </>
                ) : (
                  <td>{zahl(p.wert)}</td>
                )}
                {option.zweites && <td>{p.zweites === null ? '–' : `${zahl(p.zweites)} %`}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
