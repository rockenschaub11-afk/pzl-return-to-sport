import { useEinstellung, useTestungenVon } from '../daten'
import { useSearchParams } from 'react-router-dom'
import { speichereEinstellung } from '../db'
import { phaseNach } from '../katalog'
import { datumDeutsch, type Patient } from '../patienten/stammdaten'
import LinienDiagramm from './LinienDiagramm'
import { nachBloecken, verfuegbareOptionen } from './verlauf'
import { verlaufsDiagramme } from './verlaufDiagramme'
const zahl = (v: number | null) => (v === null ? '–' : v.toLocaleString('de-AT', { maximumFractionDigits: 1 }))

/** Weitere Verläufe nebeneinander (Visualisierung Stufe 2, Konzept D) – Darstellung dieses Browsers, nicht in der Sicherung. */
const MAX_WEITERE = 4
const weitereSchluessel = (patientId: string) => `verlaufWeitere:${patientId}`

/** Verlauf über alle Testungen eines Kürzels (Etappe-7-Frage 6). */
export default function VerlaufBereich({ patient }: { patient: Patient }) {
  const testungen = useTestungenVon(patient.id)
  const weitere = useEinstellung<string[]>(weitereSchluessel(patient.id), [])
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
  if (!testungen || !weitere) return null

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
  const zusatz = weitere.map((id) => optionen.find((o) => o.id === id)).filter((o): o is (typeof optionen)[number] => !!o && o.id !== option.id)
  const merke = (liste: string[]) => void speichereEinstellung(weitereSchluessel(patient.id), liste)
  const hinzufuegbar = optionen.filter((o) => o.id !== option.id && !zusatz.some((z) => z.id === o.id))

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

      <section className="verlauf-weitere" aria-label="Weitere Verläufe">
        <div className="block-kopf">
          <h3 className="ods-titel">Weitere Verläufe nebeneinander</h3>
          {zusatz.length < MAX_WEITERE && hinzufuegbar.length > 0 && (
            <label className="feld feld-inline">
              <span className="sr-only">Weiteren Verlauf hinzufügen</span>
              <select value="" onChange={(e) => e.target.value && merke([...zusatz.map((z) => z.id), e.target.value])}>
                <option value="">+ Verlauf hinzufügen</option>
                {nachBloecken(hinzufuegbar).map((g) => (
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
          )}
        </div>
        {zusatz.length === 0 ? (
          <p className="hinweis-leise">Bis zu {MAX_WEITERE} Größen mit gleicher Zeitachse, z. B. Kraft, Sprung, Hop und ACL-RSI – die Auswahl merkt sich dieser Browser je Kürzel.</p>
        ) : (
          <div className="verlauf-diagramme verlauf-klein">
            {zusatz.map((o) => (
              <div key={o.id} className="verlauf-kachel">
                <LinienDiagramm {...verlaufsDiagramme(patient, testungen, o).diagramme[0]} />
                <button type="button" className="knopf-leise verlauf-weg" onClick={() => merke(zusatz.filter((z) => z.id !== o.id).map((z) => z.id))} aria-label={`${o.name} entfernen`}>
                  entfernen
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

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
