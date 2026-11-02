import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { db, type Testung } from '../db'
import Laedt from '../Laedt'
import { datumDeutsch, monateSeit, NIVEAUS, passtZurSuche } from '../patienten/stammdaten'
import { nachDatum, pflichtKurz } from '../patienten/uebersicht'
import { statusText } from '../testung/ablauf'

export default function PatientenListe() {
  const navigate = useNavigate()
  const patienten = useLiveQuery(() => db.patienten.orderBy('geaendertAm').reverse().toArray())
  const testungen = useLiveQuery(() => db.testungen.toArray())
  const [adresse, setAdresse] = useSearchParams()
  const suche = adresse.get('suche') ?? ''
  const nurArbeit = adresse.get('filter') === 'arbeit'
  const setze = (feld: string, wert: string) =>
    setAdresse(
      (a) => {
        if (wert) a.set(feld, wert)
        else a.delete(feld)
        return a
      },
      { replace: true },
    )
  // nur neu rechnen, wenn sich Daten ändern – nicht bei jedem Tastendruck in der Suche
  const staende = useMemo(() => new Map((patienten ?? []).map((p) => [p.id, pflichtKurz(p, (testungen ?? []).filter((t) => t.patientId === p.id))])), [patienten, testungen])

  if (!patienten || !testungen) return <Laedt />
  const letzte = new Map<string, Testung>()
  for (const t of nachDatum(testungen)) if (!letzte.has(t.patientId)) letzte.set(t.patientId, t)
  const treffer = patienten.filter((p) => passtZurSuche(p, suche) && (!nurArbeit || letzte.get(p.id)?.status === 'in_arbeit'))

  return (
    <section>
      <div className="seitenkopf">
        <div>
          <h1 className="seitentitel">Pat.-Liste</h1>
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
            <input type="search" placeholder="Kürzel oder Sportart suchen …" value={suche} onChange={(e) => setze('suche', e.target.value)} autoComplete="off" />
          </label>
          <label className="liste-filter">
            <input type="checkbox" checked={nurArbeit} onChange={(e) => setze('filter', e.target.checked ? 'arbeit' : '')} />
            Nur mit Testung in Arbeit
          </label>

          {treffer.length === 0 ? (
            <p className="hinweis-leise">{suche ? `Kein Kürzel passt zu „${suche}“.` : 'Keine Testung in Arbeit.'}</p>
          ) : (
            <div className="liste-rahmen">
              <table className="liste-tabelle">
                <thead>
                  <tr>
                    <th scope="col">Kürzel</th>
                    <th scope="col">OP / Verletzung</th>
                    <th scope="col">Merkmale</th>
                    <th scope="col">Phase</th>
                    <th scope="col">Pflicht</th>
                    <th scope="col">Letzte Testung</th>
                  </tr>
                </thead>
                <tbody>
                  {treffer.map((p) => {
                    const monate = monateSeit(p.opDatum)
                    const t = letzte.get(p.id)
                    const stand = staende.get(p.id)
                    return (
                      // ganze Zeile anklickbar; per Tastatur über den Link im Kürzel
                      <tr key={p.id} onClick={() => navigate(`/patienten/${p.id}`)}>
                        <td>
                          <Link to={`/patienten/${p.id}`} className="liste-kuerzel" translate="no">
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
                        <td>{stand ? stand.phase : <span className="liste-leise">–</span>}</td>
                        <td className="liste-zahl">{stand && stand.gesamt > 0 ? `${stand.erfuellt} / ${stand.gesamt}` : <span className="liste-leise">–</span>}</td>
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
