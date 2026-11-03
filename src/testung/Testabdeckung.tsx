// Testabdeckung als Tabelle (Visualisierung Stufe 2, Konzept A): Zeilen = Tests nach Block, Spalten = Testungen nach Datum.
// Punkt in der Farbe des Kartenstatus, Ring = im Testset, aber nicht gemessen, leer = gehört nicht zur Testung.

import { Link } from 'react-router-dom'
import { datumDeutsch } from '../patienten/stammdaten'
import type { Abdeckung, AbdeckungZelle } from './abdeckung'

const ZEICHEN = { gruen: '✓', gelb: '~', rot: '✗' } as const

function Zelle({ z }: { z: AbdeckungZelle }) {
  if (z.zustand === 'nicht_im_set') return <span className="abdeckung-leer" aria-label="gehört nicht zur Testung" />
  if (z.zustand === 'fehlt') return <span className="abdeckung-punkt abdeckung-fehlt" role="img" aria-label="nicht gemessen" title="nicht gemessen" />
  return (
    <span className={`abdeckung-punkt${z.ampel ? ` abdeckung-${z.ampel}` : ''}`} role="img" aria-label={z.text} title={z.text}>
      {z.ampel ? ZEICHEN[z.ampel] : ''}
    </span>
  )
}

export default function Testabdeckung({ abdeckung }: { abdeckung: Abdeckung }) {
  const { spalten, bloecke } = abdeckung
  return (
    <div className="abdeckung">
      <div className="abdeckung-rollen">
        <table className="abdeckung-tabelle">
          <thead>
            <tr>
              <th scope="col">Test</th>
              {spalten.map((s) => (
                <th key={s.testungId} scope="col" className="abdeckung-spalte">
                  <Link to={`/testung/${s.testungId}`}>{datumDeutsch(s.datum)}</Link>
                  <small>
                    {s.monate === null ? '–' : `${Math.round(s.monate)} Mo`} · {s.phase}
                  </small>
                </th>
              ))}
            </tr>
          </thead>
          {bloecke.map((b) => (
            <tbody key={b.block}>
              <tr className="abdeckung-block">
                <th scope="colgroup" colSpan={spalten.length + 1}>
                  {b.name}
                </th>
              </tr>
              {b.zeilen.map((z) => (
                <tr key={z.id}>
                  <th scope="row">{z.name}</th>
                  {z.zellen.map((c, i) => (
                    <td key={spalten[i].testungId}>
                      <Zelle z={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <p className="diagramm-legende">
        <span>
          <span className="abdeckung-punkt abdeckung-gruen">✓</span> erfüllt · <span className="abdeckung-punkt abdeckung-gelb">~</span> knapp ·{' '}
          <span className="abdeckung-punkt abdeckung-rot">✗</span> nicht erfüllt (Pflicht-Kriterien wie im Kopf der Testkarte)
        </span>
        <span>
          <span className="abdeckung-punkt" /> erfasst, ohne Pflicht-Bewertung
        </span>
        <span>
          <span className="abdeckung-punkt abdeckung-fehlt" /> im Testset, nicht gemessen
        </span>
      </p>
    </div>
  )
}
