import { MELOQ, ODS_REIHENFOLGE, zusatzFuer, type MeloqTest, type Ods } from '../katalog/meloq'
import { metrikUmschalten, type MeloqAuswahl } from './meloqAuswahl'

/** Kleine Marke O / D / S mit Erklärung beim Darüberfahren. */
export function OdsMarke({ ods }: { ods: Ods }) {
  const g = MELOQ.ods[ods]
  return (
    <span className={`ods-marke ods-${ods}`} title={`${g.name} (${g.kurz}): ${g.erklaerung}`}>
      {g.name[0]}
    </span>
  )
}

/** Optional aufklappbare Kurz-Erklärung des ODS-Frameworks. */
export function OdsErklaerung() {
  return (
    <details className="ods-erklaerung">
      <summary>Was heißt Output / Driver / Strategy?</summary>
      <ul>
        {ODS_REIHENFOLGE.map((o) => (
          <li key={o}>
            <OdsMarke ods={o} /> <strong>{MELOQ.ods[o].name}</strong> ({MELOQ.ods[o].kurz}): {MELOQ.ods[o].erklaerung}
          </li>
        ))}
      </ul>
      <p>{MELOQ.odsHinweis}</p>
      <p className="kat-quelle">Quelle: {MELOQ.odsQuelle}</p>
    </details>
  )
}

/** Häkchen je Metrik, gruppiert nach O/D/S – ändert den persönlichen Standard dieses Laptops. */
export default function MetrikWahl({ test, auswahl }: { test: MeloqTest; auswahl: MeloqAuswahl }) {
  return (
    <div className="metrik-wahl">
      {ODS_REIHENFOLGE.map((ods) => {
        const metriken = zusatzFuer(test).filter((m) => m.ods === ods)
        if (metriken.length === 0) return null
        return (
          <fieldset key={ods} className="metrik-gruppe">
            <legend>
              <OdsMarke ods={ods} /> {MELOQ.ods[ods].name}
            </legend>
            {metriken.map((m) => (
              <label key={m.id} className="haken">
                <input type="checkbox" checked={auswahl[test].includes(m.id)} onChange={() => metrikUmschalten(auswahl, test, m.id)} />
                <span>{m.name}</span>
              </label>
            ))}
          </fieldset>
        )
      })}
    </div>
  )
}
