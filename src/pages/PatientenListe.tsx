import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, type Testung } from '../db'
import Laedt from '../Laedt'
import { datumDeutsch, monateSeit, NIVEAUS, passtZurSuche } from '../patienten/stammdaten'
import { nachDatum } from '../patienten/uebersicht'
import { statusText } from '../testung/ablauf'

export default function PatientenListe() {
  const navigate = useNavigate()
  const patienten = useLiveQuery(() => db.patienten.orderBy('geaendertAm').reverse().toArray())
  const testungen = useLiveQuery(() => db.testungen.toArray())
  const [suche, setSuche] = useState('')

  if (!patienten || !testungen) return <Laedt />
  const treffer = patienten.filter((p) => passtZurSuche(p, suche))
  const letzte = new Map<string, Testung>()
  for (const t of nachDatum(testungen)) if (!letzte.has(t.patientId)) letzte.set(t.patientId, t)

  return (
    <section>
      <div className="seitenkopf">
        <div>
          <h2 className="seitentitel">Pat.-Liste</h2>
          <p className="seitenzusatz">
            {patienten.length === 1 ? '1 Kürzel' : `${patienten.length} Kürzel`} auf diesem Laptop
          </p>
        </div>
        <Link to="/patienten/neu" className="knopf knopf-haupt">
          <span>+ Neues Kürzel</span>
        </Link>
      </div>

      {patienten.length === 0 ? (
        <div className="leer karte">
          <p className="leer-titel">Noch keine Kürzel angelegt</p>
          <p>Leg das erste Kürzel an, z. B. „MH-1998“ (Initialen + Geburtsjahr). Namen werden nie gespeichert.</p>
        </div>
      ) : (
        <div className="karte">
          <label className="suche">
            <span className="sr-only">Suchen</span>
            <input type="search" placeholder="Kürzel oder Sportart suchen …" value={suche} onChange={(e) => setSuche(e.target.value)} />
          </label>

          {treffer.length === 0 ? (
            <p className="hinweis-leise">Kein Kürzel passt zu „{suche}“.</p>
          ) : (
            <div className="liste-rahmen">
              <table className="liste-tabelle">
                <thead>
                  <tr>
                    <th>Kürzel</th>
                    <th>OP / Verletzung</th>
                    <th>Merkmale</th>
                    <th>Letzte Testung</th>
                  </tr>
                </thead>
                <tbody>
                  {treffer.map((p) => {
                    const monate = monateSeit(p.opDatum)
                    const t = letzte.get(p.id)
                    return (
                      // ganze Zeile anklickbar; per Tastatur über den Link im Kürzel
                      <tr key={p.id} onClick={() => navigate(`/patienten/${p.id}`)}>
                        <td>
                          <Link to={`/patienten/${p.id}`} className="liste-kuerzel">
                            <span className="seiten-marke" title={`Betroffen: ${p.seite}`} aria-label={`betroffen: ${p.seite}`}>
                              {p.seite === 'links' ? 'L' : 'R'}
                            </span>
                            {p.kuerzel}
                          </Link>
                        </td>
                        <td className="liste-zahl">
                          {p.konservativ ? 'Verletzung' : 'OP'} {datumDeutsch(p.opDatum)}
                          {monate !== null && <span className="liste-leise"> · {monate} Mo.</span>}
                        </td>
                        <td>
                          <span className="pat-chips">
                            {p.niveau && <span className={`chip chip-${p.niveau}`}>{NIVEAUS[p.niveau]}</span>}
                            {p.sportart && <span className="chip">{p.sportart}</span>}
                            {p.revision && <span className="chip">Revision</span>}
                            {p.konservativ && <span className="chip">konservativ</span>}
                          </span>
                        </td>
                        <td>
                          {t ? (
                            <span className="liste-stapel">
                              <span className="liste-zahl">{datumDeutsch(t.datum)}</span>
                              <span className={`status${t.status === 'abgeschlossen' ? '' : ' status-arbeit'}`}>{statusText(t)}</span>
                            </span>
                          ) : (
                            <span className="liste-leise">–</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
