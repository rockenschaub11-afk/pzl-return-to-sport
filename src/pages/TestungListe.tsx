import { usePatienten, useTestungen } from '../daten'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { neueTestung } from '../db'
import Laedt from '../Laedt'
import { KATALOG } from '../katalog'
import { datumDeutsch, isoDatum } from '../patienten/stammdaten'
import { ART_TEXT, fortschritt, monateBisTestung, phaseAusMonaten, phasenStand, statusText } from '../testung/ablauf'

export default function TestungListe() {
  const navigate = useNavigate()
  const testungen = useTestungen('zuletzt')
  const patienten = usePatienten('kuerzel')
  const [eingabe, setEingabe] = useState('')

  if (!testungen || !patienten) return <Laedt />
  const auswahl = patienten.find((p) => p.kuerzel.toLowerCase() === eingabe.trim().toLowerCase())?.id ?? ''
  const kuerzel = new Map(patienten.map((p) => [p.id, p.kuerzel]))
  const opDatum = new Map(patienten.map((p) => [p.id, p.opDatum]))
  const beschreibung = (t: (typeof testungen)[number]) => {
    const ph = phasenStand(t, opDatum.get(t.patientId) ?? '')
    return { ph, text: `${ART_TEXT[ph.art]} · ${KATALOG.phasen.find((x) => x.id === ph.phase)?.name} · ${datumDeutsch(t.datum)}` }
  }
  const offen = testungen.filter((t) => t.status === 'in_arbeit')
  const fertig = testungen.filter((t) => t.status === 'abgeschlossen').slice(0, 20)

  async function starten() {
    if (!auswahl) return
    const heute = isoDatum(new Date())
    const p = patienten?.find((x) => x.id === auswahl)
    const phase = phaseAusMonaten(monateBisTestung(p?.opDatum ?? heute, heute) ?? 0)
    navigate(`/testung/${await neueTestung(auswahl, heute, phase)}`)
  }

  return (
    <section>
      <div className="seitenkopf">
        <div>
          <h1 className="seitentitel">Testung</h1>
          <p className="seitenzusatz">Phase und Testset ergeben sich aus OP-Datum und Datum der Testung.</p>
        </div>
      </div>

      <div className="karte block">
        <h2 className="block-titel">Neue Testung</h2>
        {patienten.length === 0 ? (
          <p className="hinweis-leise">
            Zuerst ein Kürzel anlegen: <Link to="/patienten/neu">+ Neues Kürzel</Link>
          </p>
        ) : (
          <div className="aktionen">
            <label className="feld feld-inline kuerzel-wahl">
              <span className="sr-only">Kürzel</span>
              <input list="kuerzel-vorschlaege" value={eingabe} onChange={(e) => setEingabe(e.target.value)} placeholder="Kürzel eintippen oder wählen …" autoComplete="off" />
              <datalist id="kuerzel-vorschlaege">
                {patienten.map((p) => (
                  <option key={p.id} value={p.kuerzel} />
                ))}
              </datalist>
            </label>
            <button type="button" className="knopf knopf-haupt" onClick={starten} disabled={!auswahl}>
              <span>Testung starten</span>
            </button>
            {!auswahl && <span className="hinweis-leise">{eingabe.trim() ? 'Dieses Kürzel gibt es nicht.' : 'Zuerst ein Kürzel wählen.'}</span>}
          </div>
        )}
      </div>

      <div className="karte">
        <h2 className="block-titel">In Arbeit</h2>
        {offen.length === 0 ? (
          <p className="hinweis-leise">Keine angefangenen Testungen.</p>
        ) : (
          <div className="liste-rahmen">
            <table className="liste-tabelle">
              <thead>
                <tr>
                  <th scope="col">Kürzel</th>
                  <th scope="col">Testung</th>
                  <th scope="col">Fortschritt</th>
                </tr>
              </thead>
              <tbody>
                {offen.map((t) => (
                  <tr key={t.id} onClick={() => navigate(`/testung/${t.id}`)}>
                    <td>
                      <Link to={`/testung/${t.id}`} className="liste-kuerzel" translate="no">
                        {kuerzel.get(t.patientId) ?? '?'}
                      </Link>
                    </td>
                    <td>{beschreibung(t).text}</td>
                    <td>{(() => {
                      const f = fortschritt(t, beschreibung(t).ph.phase)
                      return <span className="liste-zahl">{f.erfasst} / {f.gesamt} Tests</span>
                    })()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {fertig.length > 0 && (
        <div className="karte block">
          <h2 className="block-titel">Zuletzt abgeschlossen</h2>
          <div className="liste-rahmen">
            <table className="liste-tabelle">
              <thead>
                <tr>
                  <th scope="col">Kürzel</th>
                  <th scope="col">Testung</th>
                  <th scope="col">Stand</th>
                </tr>
              </thead>
              <tbody>
                {fertig.map((t) => (
                  <tr key={t.id} onClick={() => navigate(`/testung/${t.id}`)}>
                    <td>
                      <Link to={`/testung/${t.id}`} className="liste-kuerzel" translate="no">
                        {kuerzel.get(t.patientId) ?? '?'}
                      </Link>
                    </td>
                    <td>{beschreibung(t).text}</td>
                    <td><span className="status">{statusText(t)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
