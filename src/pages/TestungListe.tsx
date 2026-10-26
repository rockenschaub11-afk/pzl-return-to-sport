import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, neueTestung } from '../db'
import { KATALOG } from '../katalog'
import { datumDeutsch, isoDatum } from '../patienten/stammdaten'
import { ART_TEXT, fortschritt, monateBisTestung, phaseAusMonaten, phasenStand, statusText } from '../testung/ablauf'

export default function TestungListe() {
  const navigate = useNavigate()
  const testungen = useLiveQuery(() => db.testungen.orderBy('geaendertAm').reverse().toArray())
  const patienten = useLiveQuery(() => db.patienten.orderBy('kuerzelNorm').toArray())
  const [auswahl, setAuswahl] = useState('')

  if (!testungen || !patienten) return null
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
          <h2 className="seitentitel">Testung</h2>
          <p className="seitenzusatz">Phase und Testset ergeben sich aus OP-Datum und Datum der Testung.</p>
        </div>
      </div>

      <div className="karte block">
        <h3 className="block-titel">Neue Testung</h3>
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
              <span>Testung starten</span>
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
              const b = beschreibung(t)
              const f = fortschritt(t, b.ph.phase)
              return (
                <li key={t.id}>
                  <Link to={`/testung/${t.id}`} className="testung-zeile">
                    <span className="testung-kuerzel">{kuerzel.get(t.patientId) ?? '?'}</span>
                    <span>{beschreibung(t).text}</span>
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

      {fertig.length > 0 && (
        <div className="karte block">
          <h3 className="block-titel">Zuletzt abgeschlossen</h3>
          <ul className="testung-liste">
            {fertig.map((t) => (
              <li key={t.id}>
                <Link to={`/testung/${t.id}`} className="testung-zeile">
                  <span className="testung-kuerzel">{kuerzel.get(t.patientId) ?? '?'}</span>
                  <span>{beschreibung(t).text}</span>
                  <span className="testung-fortschritt">{statusText(t)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
