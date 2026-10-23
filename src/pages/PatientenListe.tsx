import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db'
import { datumDeutsch, monateSeit, NIVEAUS, passtZurSuche } from '../patienten/stammdaten'

export default function PatientenListe() {
  const patienten = useLiveQuery(() => db.patienten.orderBy('geaendertAm').reverse().toArray())
  const [suche, setSuche] = useState('')

  if (!patienten) return null
  const treffer = patienten.filter((p) => passtZurSuche(p, suche))

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
        <>
          <label className="suche">
            <span className="sr-only">Suchen</span>
            <input
              type="search"
              placeholder="Kürzel oder Sportart suchen …"
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
            />
          </label>

          {treffer.length === 0 ? (
            <p className="hinweis-leise">Kein Kürzel passt zu „{suche}“.</p>
          ) : (
            <ul className="pat-raster">
              {treffer.map((p) => {
                const monate = monateSeit(p.opDatum)
                return (
                  <li key={p.id}>
                    <Link to={`/patienten/${p.id}`} className="pat-karte">
                      <span className={`seiten-marke seite-${p.seite}`} title={`Betroffen: ${p.seite}`}>
                        {p.seite === 'links' ? 'L' : 'R'}
                      </span>
                      <span className="pat-kuerzel">{p.kuerzel}</span>
                      <span className="pat-info">
                        {p.konservativ ? 'Verletzung' : 'OP'} {datumDeutsch(p.opDatum)}
                        {monate !== null && <strong> · {monate} Mo.</strong>}
                      </span>
                      <span className="pat-chips">
                        {p.niveau && <span className={`chip chip-${p.niveau}`}>{NIVEAUS[p.niveau]}</span>}
                        {p.sportart && <span className="chip">{p.sportart}</span>}
                        {p.revision && <span className="chip">Revision</span>}
                        {p.konservativ && <span className="chip">konservativ</span>}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
