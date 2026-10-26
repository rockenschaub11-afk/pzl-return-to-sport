import { MELOQ, ODS_REIHENFOLGE, type MeloqTest } from '../katalog/meloq'
import type { Berechnung, TestEingabe } from './erfassung'
import { kernStrategie, zusatzZeilen, type MeloqZeile } from './meloq'
import type { MeloqAuswahl } from './meloqAuswahl'
import MetrikWahl, { OdsErklaerung, OdsMarke } from './MetrikWahl'
import type { Seitennamen } from './TestKarte'

const zahl = (v: number | null, nachkomma = 1) =>
  v === null ? '–' : v.toLocaleString('de-AT', { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma })

function Vergleich({ z }: { z: MeloqZeile }) {
  if (!z.vergleich || z.vergleich.wert === null) return null
  return (
    <span className="meloq-vergleich">
      {z.vergleich.art === 'lsi' ? 'LSI' : 'Asym.'} {zahl(z.vergleich.wert)} %
    </span>
  )
}

interface Props {
  test: MeloqTest
  eingabe: TestEingabe
  setze: (feld: string, wert: string) => void
  seiten: Seitennamen
  berechnung: Berechnung
  auswahl: MeloqAuswahl
  kg: number | null
}

/** Strategy-Wert des Kern-Satzes – ohne Ampel, mit LSI (gehört in den Ergebnisbereich der Karte). */
export function KernStrategie({ test, eingabe, berechnung, seiten }: Pick<Props, 'test' | 'eingabe' | 'berechnung' | 'seiten'>) {
  const k = kernStrategie(test, eingabe, berechnung)
  if (k.werte.every((w) => w === null)) return null
  return (
    <p className="test-zusatz">
      <OdsMarke ods="strategy" /> {k.name}:{' '}
      {k.form === 'gb' ? `${seiten.gesund} ${zahl(k.werte[0], 0)} · ${seiten.betroffen} ${zahl(k.werte[1], 0)} ms` : `${zahl(k.werte[0], 0)} ms`} <Vergleich z={k} />{' '}
      <span className="kriterium-status">(ohne Ampel)</span>
    </p>
  )
}

/** Frei wählbare Meloq-Werte des gewerteten Versuchs (Etappe-5-Fragen 3–7). */
export default function MeloqBereich({ test, eingabe: e, setze, seiten, berechnung: b, auswahl, kg }: Props) {
  const zeilen = zusatzZeilen(test, e, auswahl[test], kg)
  const versuchText =
    test === 'cmj'
      ? b.besterVersuch.gesamt
        ? `Versuch ${b.besterVersuch.gesamt} (größte Höhe)`
        : 'Versuch mit der größten Höhe'
      : `${seiten.gesund}: ${b.besterVersuch.gesund ? `Versuch ${b.besterVersuch.gesund}` : '–'} · ${seiten.betroffen}: ${b.besterVersuch.betroffen ? `Versuch ${b.besterVersuch.betroffen}` : '–'}`
  const spalten = test === 'cmj' ? ['Links', 'Rechts'] : [seiten.gesund, seiten.betroffen]

  return (
    <div className="meloq-bereich">
      <div className="meloq-kopf">
        <h5>Weitere Meloq-Werte</h5>
        <span className="hinweis-leise">{versuchText}</span>
      </div>

      {zeilen.length > 0 ? (
        <table className="eingabe-raster meloq-tabelle">
          <thead>
            <tr>
              <th />
              {spalten.map((s) => (
                <th key={s}>{s}</th>
              ))}
              <th>relativ</th>
              <th>{test === 'cmj' ? 'Asymmetrie' : 'LSI'}</th>
            </tr>
          </thead>
          <tbody>
            {ODS_REIHENFOLGE.flatMap((ods) =>
              zeilen
                .filter((z) => z.ods === ods)
                .map((z) => (
                  <tr key={z.id}>
                    <th scope="row">
                      <OdsMarke ods={z.ods} /> {z.name}
                      {z.hinweis && <span className="kat-kriterium-hinweis">{z.hinweis}</span>}
                    </th>
                    {z.form === 'eins' ? (
                      <td colSpan={2}>
                        <Feld wert={e[z.felder[0]]} onChange={(v) => setze(z.felder[0], v)} label={z.name} einheit={z.einheit} />
                      </td>
                    ) : (
                      z.felder.map((f, i) => (
                        <td key={f}>
                          <Feld wert={e[f]} onChange={(v) => setze(f, v)} label={`${z.name} ${spalten[i]}`} einheit={z.einheit} />
                        </td>
                      ))
                    )}
                    <td className="meloq-relativ">
                      {z.relativ && z.relativ.werte.some((w) => w !== null) ? `${z.relativ.werte.map((w) => zahl(w, z.relativ!.einheit === 'N/s' ? 0 : 1)).join(' / ')} ${z.relativ.einheit}` : ''}
                    </td>
                    <td>
                      <Vergleich z={z} />
                    </td>
                  </tr>
                )),
            )}
          </tbody>
        </table>
      ) : (
        <p className="hinweis-leise">Keine weiteren Werte gewählt.</p>
      )}

      <details className="test-mehr">
        <summary>Metriken wählen</summary>
        <p className="hinweis-leise">Die Auswahl gilt als persönlicher Standard auf diesem Laptop – auch für alle anderen Testungen.</p>
        <OdsErklaerung />
        <MetrikWahl test={test} auswahl={auswahl} />
        <p className="hinweis-leise">{MELOQ.nichtMessbar}</p>
      </details>
    </div>
  )
}

function Feld({ wert, onChange, label, einheit }: { wert?: string; onChange: (v: string) => void; label: string; einheit: string }) {
  return (
    <label className="zahl-feld">
      <input inputMode="decimal" value={wert ?? ''} onChange={(e) => onChange(e.target.value)} aria-label={label} placeholder="–" />
      {einheit && <span className="zahl-einheit">{einheit}</span>}
    </label>
  )
}
