import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, neueEndtestung } from '../db'
import { datumDeutsch, isoDatum } from '../patienten/stammdaten'
import { fortschritt } from '../testung/ablauf'

export default function TestungListe() {
  const navigate = useNavigate()
  const testungen = useLiveQuery(() => db.testungen.orderBy('geaendertAm').reverse().toArray())
  const patienten = useLiveQuery(() => db.patienten.orderBy('kuerzelNorm').toArray())
  const [auswahl, setAuswahl] = useState('')

  if (!testungen || !patienten) return null
  const kuerzel = new Map(patienten.map((p) => [p.id, p.kuerzel]))
  const offen = testungen.filter((t) => t.status === 'in_arbeit')

  async function starten() {
    if (!auswahl) return
    navigate(`/testung/${await neueEndtestung(auswahl, isoDatum(new Date()))}`)
  }

  return (
    <section>
      <div className="seitenkopf">
        <div>
          <h2 className="seitentitel">Testung</h2>
          <p className="seitenzusatz">Endtestung erfassen – Verlaufstests folgen in Etappe 7.</p>
        </div>
      </div>

      <div className="karte block">
        <h3 className="block-titel">Neue Endtestung</h3>
        {patienten.length === 0 ? (
          <p className="hinweis-leise">
            Zuerst ein Kürzel anlegen: <Link to="/patienten/neu">+ Neues Kürzel</Link>
          </p>
        ) : (
          <div className="aktionen">
            <label className="feld feld-inline">
              <span className="sr-only">Kürzel</span>
              <select value={auswahl} onChange={(e) => setAuswahl(e.target.value)}>
                <option value="">Kürzel wählen …</option>
                {patienten.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.kuerzel}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="knopf knopf-haupt" onClick={starten} disabled={!auswahl}>
              <span>Endtestung starten</span>
            </button>
          </div>
        )}
      </div>

      <div className="karte">
        <h3 className="block-titel">In Arbeit</h3>
        {offen.length === 0 ? (
          <p className="hinweis-leise">Keine angefangenen Testungen.</p>
        ) : (
          <ul className="testung-liste">
            {offen.map((t) => {
              const f = fortschritt(t)
              return (
                <li key={t.id}>
                  <Link to={`/testung/${t.id}`} className="testung-zeile">
                    <span className="testung-kuerzel">{kuerzel.get(t.patientId) ?? '?'}</span>
                    <span>Endtestung · {datumDeutsch(t.datum)}</span>
                    <span className="testung-fortschritt">
                      {f.erfasst} / {f.gesamt} Tests
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
