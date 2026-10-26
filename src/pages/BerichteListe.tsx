import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db'
import Laedt from '../Laedt'
import { phaseNach } from '../katalog'
import { datumDeutsch, normalisiereKuerzel } from '../patienten/stammdaten'
import { ART_TEXT, phasenStand, statusText } from '../testung/ablauf'

/** Menüpunkt „Berichte“: alle Testungen, je Testung Arztbericht und Pat./Trainer-Bericht. */
export default function BerichteListe() {
  const testungen = useLiveQuery(() => db.testungen.toArray())
  const patienten = useLiveQuery(() => db.patienten.toArray())
  const [suche, setSuche] = useState('')

  if (!testungen || !patienten) return <Laedt />
  const nachId = new Map(patienten.map((p) => [p.id, p]))
  const s = normalisiereKuerzel(suche)
  const liste = testungen
    .filter((t) => nachId.has(t.patientId) && nachId.get(t.patientId)!.kuerzelNorm.includes(s))
    .sort((x, y) => y.datum.localeCompare(x.datum) || y.geaendertAm.localeCompare(x.geaendertAm))

  return (
    <section>
      <div className="seitenkopf">
        <div>
          <h2 className="seitentitel">Berichte</h2>
          <p className="seitenzusatz">Arztbericht und Pat./Trainer-Bericht je Testung – drucken oder „Als PDF speichern“. Der Name wird nur beim Drucken eingetippt und nie gespeichert.</p>
        </div>
      </div>

      <div className="karte block">
        <label className="feld feld-inline">
          <span className="sr-only">Kürzel suchen</span>
          <input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Kürzel suchen …" autoComplete="off" />
        </label>
        {liste.length === 0 ? (
          testungen.length === 0 ? (
            <div className="leer">
              <p className="leer-titel">Noch keine Testung</p>
              <p>Berichte entstehen aus Testungen. Zuerst ein Kürzel wählen und eine Testung beginnen.</p>
              <Link to="/patienten" className="knopf">
                <span>Zur Pat.-Liste</span>
              </Link>
            </div>
          ) : (
            <p className="hinweis-leise">Keine Testung zu diesem Kürzel.</p>
          )
        ) : (
          <div className="liste-rahmen">
            <table className="liste-tabelle">
              <thead>
                <tr>
                  <th>Kürzel</th>
                  <th>Testung</th>
                  <th>Stand</th>
                  <th className="liste-rechts">Berichte</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((t) => {
                  const p = nachId.get(t.patientId)!
                  const ph = phasenStand(t, p.opDatum)
                  return (
                    <tr key={t.id}>
                      <td className="liste-kuerzel">{p.kuerzel}</td>
                      <td>
                        {ART_TEXT[ph.art]} · {phaseNach(ph.phase).name} · <span className="liste-zahl">{datumDeutsch(t.datum)}</span>
                      </td>
                      <td>
                        <span className={`status${t.status === 'abgeschlossen' ? '' : ' status-arbeit'}`}>{statusText(t)}</span>
                      </td>
                      <td className="liste-rechts">
                        <span className="bericht-liste-knoepfe">
                          <Link to={`/berichte/${t.id}/arzt`} className="knopf">
                            <span>Arztbericht</span>
                          </Link>
                          <Link to={`/berichte/${t.id}/pat`} className="knopf">
                            <span>Pat./Trainer-Bericht</span>
                          </Link>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
