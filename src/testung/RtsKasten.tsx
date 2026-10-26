import { HINWEIS } from '../navigation'
import { RTS_TEXT, type RtsVorschlag } from './rts'

/** Kompakter Kasten oben in der Übersicht – live (Etappe-6-Frage 9). */
export default function RtsKasten({ v, mindestMonate, onDetails }: { v: RtsVorschlag; mindestMonate: number; onDetails: () => void }) {
  const erfuellt = v.pflicht.filter((p) => p.status === 'erfuellt').length
  return (
    <div className={`rts-kasten ${v.erfuellt ? 'rts-erfuellt' : 'rts-offen'}`}>
      <p className="rts-titel">RTS-Vorschlag</p>
      <p className="rts-ergebnis">{v.erfuellt ? RTS_TEXT.erfuellt : RTS_TEXT.nicht_erfuellt}</p>
      <ul className="rts-punkte">
        <li className={v.zeitErfuellt ? 'ok' : 'nein'}>
          Zeit: {v.monate ?? '?'} Monate (mind. {mindestMonate})
        </li>
        <li className={erfuellt === v.pflicht.length ? 'ok' : 'nein'}>
          Pflicht-Tests: {erfuellt} / {v.pflicht.length} erfüllt
        </li>
        {v.aclRsiWarnung && <li className="warnung">ACL-RSI unter 55</li>}
      </ul>
      <button type="button" className="text-knopf" onClick={onDetails}>
        Details und Entscheidung ↓
      </button>
      <p className="rts-hinweis">{HINWEIS}</p>
    </div>
  )
}
