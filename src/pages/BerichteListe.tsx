import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db'
import { phaseNach } from '../katalog'
import { datumDeutsch, normalisiereKuerzel } from '../patienten/stammdaten'
import { ART_TEXT, phasenStand, statusText } from '../testung/ablauf'

/** Menüpunkt „Berichte“: alle Testungen, je Testung Arztbericht und Pat./Trainer-Bericht. */
export default function BerichteListe() {
  const testungen = useLiveQuery(() => db.testungen.toArray())
  const patienten = useLiveQuery(() => db.patienten.toArray())
  const [suche, setSuche] = useState('')

  if (!testungen || !patienten) return null
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
          <p className="hinweis-leise">{testungen.length === 0 ? 'Noch keine Testung.' : 'Keine Testung zu diesem Kürzel.'}</p>
        ) : (
          <ul className="testung-liste">
            {liste.map((t) => {
              const p = nachId.get(t.patientId)!
              const ph = phasenStand(t, p.opDatum)
              return (
                <li key={t.id} className="bericht-liste-zeile">
                  <span>
                    <strong>{p.kuerzel}</strong> · {ART_TEXT[ph.art]} · {phaseNach(ph.phase).name} · {datumDeutsch(t.datum)}
                  </span>
                  <span className={`status${t.status === 'abgeschlossen' ? '' : ' status-arbeit'}`}>{statusText(t)}</span>
                  <span className="bericht-liste-knoepfe">
                    <Link to={`/berichte/${t.id}/arzt`} className="knopf">
                      <span>Arztbericht</span>
                    </Link>
                    <Link to={`/berichte/${t.id}/pat`} className="knopf">
                      <span>Pat./Trainer-Bericht</span>
                    </Link>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
