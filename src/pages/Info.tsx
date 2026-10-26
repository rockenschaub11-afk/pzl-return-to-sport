import { Fragment } from 'react'
import { KATALOG, protokollNach } from '../katalog'
import { BLOCK_NAMEN, BLOECKE, PHASEN_IDS, STATUS_NAMEN, type Kriterium, type PhaseId, type TestDef } from '../katalog/typen'
import { MELOQ, MELOQ_TESTS } from '../katalog/meloq'
import { schwelleFuer } from '../rechnen/bewertung'
import BeispielKarte from './BeispielKarte'
import { useMeloqAuswahl } from '../testung/meloqAuswahl'
import MetrikWahl, { OdsErklaerung } from '../testung/MetrikWahl'

const zahl = (v: number, nachkomma?: number) =>
  v.toLocaleString('de-AT', { minimumFractionDigits: nachkomma ?? 0, maximumFractionDigits: Math.max(nachkomma ?? 0, 2) })
const ZEICHEN = { '>': '>', '>=': '≥', '<': '<', '<=': '≤' } as const

/** Inhalt einer Tabellenzelle: Schwelle des Kriteriums in dieser Phase. */
function Zelle({ test, k, phase }: { test: TestDef; k: Kriterium; phase: PhaseId }) {
  if (!test.phasen.includes(phase)) return <td className="kat-leer" title="nicht im Testset dieser Phase">·</td>
  if (k.art === 'auswahl') return <td>{k.erlaubt?.join(' / ')}</td>
  if (k.art === 'janein') return <td>ja</td>
  const s = schwelleFuer(k, phase)
  if (!s || !k.vergleich) return <td className="kat-leer">{Object.keys(k.werte).length === 0 ? 'Info' : '–'}</td>
  const bereich = k.bereiche?.[phase]
  return (
    <td className={s.uebernommen ? 'kat-uebernommen' : undefined} title={s.uebernommen ? 'aus der Phase davor übernommen' : undefined}>
      {ZEICHEN[k.vergleich]} {zahl(s.wert, k.art === 'absolut' || k.art === 'asymmetrie' ? k.nachkomma : undefined)}
      {k.einheit && k.einheit !== '%' ? ` ${k.einheit}` : k.einheit}
      {bereich && <span className="kat-bereich"> ({zahl(bereich[0], k.nachkomma)}–{zahl(bereich[1], k.nachkomma)})</span>}
    </td>
  )
}

function StatusMarke({ status }: { status: Kriterium['status'] }) {
  return <span className={`kat-status kat-status-${status}`}>{STATUS_NAMEN[status]}</span>
}

export default function Info() {
  const { regeln, phasen } = KATALOG
  const meloqAuswahl = useMeloqAuswahl()
  return (
    <section>
      <div className="seitenkopf">
        <div>
          <h2 className="seitentitel">Einstellungen/Info</h2>
          <p className="seitenzusatz">Einstellungen folgen in späteren Etappen. Hier der Testkatalog zum Gegenlesen.</p>
        </div>
      </div>

      <BeispielKarte />

      <div className="karte kat-regeln kat-block">
        <h3>Meloq-Metriken (persönlicher Standard)</h3>
        <p>
          Welche weiteren Meloq-Werte in der Testung zum Eintragen angeboten werden. Der Kern-Satz ist immer dabei. Die Auswahl gilt für diesen
          Laptop und lässt sich auch direkt in der Testung unter „Metriken wählen“ ändern.
        </p>
        <OdsErklaerung />
        {meloqAuswahl && (
          <div className="meloq-einstellung">
            {MELOQ_TESTS.map((t) => (
              <div key={t}>
                <h4>{KATALOG.tests.find((x) => x.id === t)?.name}</h4>
                <p className="hinweis-leise">Kern-Satz: {MELOQ.kern[t].map((k) => k.name).join(' · ')}</p>
                <MetrikWahl test={t} auswahl={meloqAuswahl} />
              </div>
            ))}
          </div>
        )}
        <p className="hinweis-leise">{MELOQ.nichtMessbar}</p>
      </div>

      <div className="karte kat-regeln kat-block">
        <h3>Testkatalog & Schwellen</h3>
        <p>
          Alle Schwellen sind fest in der App hinterlegt (Änderung nur per Update). Jede Schwelle trägt ihre Quelle.
        </p>
        <ul>
          <li>
            <strong>LSI</strong> = betroffen / gesund × 100, bei Zeittests gesund / betroffen × 100. Ampel: grün ≥ {regeln.lsi.gruenAb} %, gelb{' '}
            {regeln.lsi.gelbAb}–{regeln.lsi.gruenAb - 1} %, rot &lt; {regeln.lsi.gelbAb} %. Die Ampel richtet sich nach der angezeigten Zahl
            (eine Nachkommastelle).
          </li>
          <li>
            <strong>Asymmetrie</strong> wie Meloq: (stärker − schwächer) / stärker × 100.
          </li>
          <li>
            <strong>Gesamt-Ampel</strong> eines Tests = die schlechtere aus Absolutwert und LSI. Nur „Pflicht“ und „wünschenswert“ zählen,
            „Warnung“ gibt einen Hinweis, „Info“ hat keine Ampel.
          </li>
          <li>
            <strong>Frauen:</strong> {regeln.frauenHinweis} (in der Tabelle mit ♀ markiert)
          </li>
          <li>
            <strong>Versuche:</strong> {regeln.versucheJeSeite} je Seite, Bestwert zählt; Hinweis „Messung wiederholen?“ bei Variationskoeffizient
            &gt; {regeln.variationskoeffizientWarnungUeber} % ({regeln.variationskoeffizientQuelle}).
          </li>
          <li>
            <strong>Einheiten:</strong> kg × {zahl(regeln.erdbeschleunigung)} = N; Meloq Net Impulse kg·s × {zahl(regeln.erdbeschleunigung)} /
            Körpergewicht = Ns/kg.
          </li>
          <li>
            <strong>Leere Phase</strong> übernimmt die Schwelle der Phase davor (<span className="kat-uebernommen">grau kursiv</span>). Bereiche in
            Klammern sind Read-95-%-Bereiche; als Schwelle gilt die untere Grenze (bei „weniger ist besser“ die obere).
          </li>
          <li>
            <strong>·</strong> = Test gehört nicht zum Testset dieser Phase.
          </li>
        </ul>
      </div>

      {BLOECKE.map((block) => {
        const tests = KATALOG.tests.filter((t) => t.block === block)
        return (
          <div key={block} className="karte kat-block">
            <h3>{BLOCK_NAMEN[block]}</h3>
            <div className="kat-tabelle-huelle">
              <table className="kat-tabelle">
                <colgroup>
                  <col className="kat-spalte-test" />
                  {phasen.map((p) => (
                    <col key={p.id} className="kat-spalte-phase" />
                  ))}
                  <col className="kat-spalte-status" />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>Test / Kriterium</th>
                    {phasen.map((p) => (
                      <th key={p.id} title={p.lang}>
                        {p.name}
                      </th>
                    ))}
                    <th>Status</th>
                    <th>Quelle</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t) => {
                    const protokoll = t.protokoll ? protokollNach(t.protokoll) : undefined
                    return (
                      <Fragment key={t.id}>
                        <tr className="kat-test">
                          <th colSpan={PHASEN_IDS.length + 3} scope="rowgroup">
                            {t.name}
                            {t.inEndtestung && <span className="chip">Endtestung</span>}
                            {t.optional && <span className="chip">optional</span>}
                            {t.zeitTest && <span className="chip">Zeittest</span>}
                            {(t.hinweise?.length || protokoll) && (
                              <span className="kat-hinweise">
                                {protokoll && (
                                  <span>
                                    Protokoll: {protokoll.ablauf}
                                    {protokoll.winkelGrad !== undefined && ` Winkel ${protokoll.winkelGrad}°.`}
                                  </span>
                                )}
                                {t.hinweise?.map((h) => (
                                  <span key={h}>{h}</span>
                                ))}
                              </span>
                            )}
                          </th>
                        </tr>
                        {t.kriterien.map((k) => (
                          <tr key={k.id}>
                            <td className="kat-kriterium">
                              {k.bezeichnung}
                              {k.frauenWuenschenswert && <span title={regeln.frauenHinweis}> ♀</span>}
                              {k.hinweis && <span className="kat-kriterium-hinweis">{k.hinweis}</span>}
                            </td>
                            {PHASEN_IDS.map((p) => (
                              <Zelle key={p} test={t} k={k} phase={p} />
                            ))}
                            <td>
                              <StatusMarke status={k.status} />
                            </td>
                            <td className="kat-quelle">{k.quelle}</td>
                          </tr>
                        ))}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      <div className="karte kat-block">
        <h3>Protokolle</h3>
        <dl className="kat-protokolle">
          {KATALOG.protokolle.map((p) => (
            <div key={p.id}>
              <dt>{p.name}</dt>
              <dd>
                {p.ablauf}
                {p.winkelGrad !== undefined && ` Winkel ${p.winkelGrad}°.`}
                {p.boxhoeheCm !== undefined && ` Box ${p.boxhoeheCm} cm.`}
                <br />
                <em>Warum:</em> {p.warum} <span className="kat-quelle">({p.quelle})</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="hinweis-leise">
          HHD-Krafttests erst ab ca. {regeln.hhdAbWochen} Wochen post-OP ({regeln.hhdAbWochenQuelle}).
        </p>
      </div>
    </section>
  )
}
