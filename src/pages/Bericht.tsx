import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { AMPEL_ZEICHEN, arztBericht, patBericht, verlaufTabelle, type ArztBericht, type Bewertung, type PatBericht, type VerlaufTabelle } from '../berichte/bericht'
import Spinnennetz from '../berichte/Spinnennetz'
import { db, type Testung } from '../db'
import Laedt from '../Laedt'
import { MELOQ } from '../katalog/meloq'
import { HINWEIS } from '../navigation'
import { datumDeutsch, type Patient } from '../patienten/stammdaten'
import { KATALOG } from '../katalog'
import type { RohTest } from '../berichte/nachvollziehbarkeit'
import LinienDiagramm from '../testung/LinienDiagramm'
import { useMeloqAuswahl } from '../testung/meloqAuswahl'
import { verfuegbareOptionen } from '../testung/verlauf'
import { verlaufsDiagramme } from '../testung/verlaufDiagramme'

const logoUrl = `${import.meta.env.BASE_URL}logo-pzl.svg`
const PRAXIS = 'Physio Zentrum Linz'

/** Druckansicht für Arztbericht und Pat./Trainer-Bericht (Etappe 9). „Als PDF speichern“ im Druckdialog des Browsers. */
export default function Bericht() {
  const { id, art } = useParams()
  const arzt = art !== 'pat'
  const testung = useLiveQuery(async () => (id ? ((await db.testungen.get(id)) ?? null) : null), [id])
  const patient = useLiveQuery(() => (testung ? db.patienten.get(testung.patientId) : undefined), [testung?.patientId])
  const alle = useLiveQuery(async () => (testung ? db.testungen.where('patientId').equals(testung.patientId).toArray() : undefined), [testung?.patientId])
  const meloqAuswahl = useMeloqAuswahl()
  // Name nur im Arbeitsspeicher dieser Seite – wird nie gespeichert (F9). Beim Verlassen der Seite ist er weg.
  const [name, setName] = useState('')
  const [verlaufWahl, setVerlaufWahl] = useState('')

  // Dateiname beim „Als PDF speichern“ = Seitentitel – nur mit Kürzel, nie mit Name
  useEffect(() => {
    if (!testung || !patient) return
    const vorher = document.title
    document.title = `${arzt ? 'Arztbericht' : 'Pat.-Trainer-Bericht'} ${patient.kuerzel} ${testung.datum}`
    return () => {
      document.title = vorher
    }
  }, [arzt, testung, patient])

  if (testung === undefined) return <Laedt />
  if (testung === null) {
    return (
      <div className="karte">
        <p>Diese Testung gibt es nicht (mehr).</p>
        <Link to="/berichte" className="knopf">
          <span>Zu den Berichten</span>
        </Link>
      </div>
    )
  }
  if (!patient || !alle) return <Laedt />

  return (
    <section>
      <Fusszeile text={`${patient.kuerzel} · ${arzt ? 'Arztbericht' : 'Pat./Trainer-Bericht'} · Testung ${datumDeutsch(testung.datum)}`} />
      <div className="bericht-steuerung karte">
        <div className="seitenkopf">
          <div>
            <p className="seitenzusatz">
              <Link to={`/testung/${testung.id}`}>← Zur Testung</Link> · <Link to="/berichte">Alle Berichte</Link>
            </p>
            <h2 className="seitentitel">Bericht {patient.kuerzel}</h2>
          </div>
          <nav className="bericht-umschalter" aria-label="Berichtsart">
            <NavLink to={`/berichte/${testung.id}/arzt`} className="umschalter-knopf">
              Arztbericht
            </NavLink>
            <NavLink to={`/berichte/${testung.id}/pat`} className="umschalter-knopf">
              Pat./Trainer-Bericht
            </NavLink>
          </nav>
        </div>

        <div className="feld-reihe">
          <label className="feld">
            <span className="feld-label">Name für den Ausdruck (optional)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" spellCheck={false} placeholder="Vor- und Nachname" />
            <span className="feld-hilfe">Wird nur in diesen Ausdruck eingesetzt und nie gespeichert – beim Verlassen der Seite ist er weg.</span>
          </label>
          {arzt && (
            <VerlaufWahl patient={patient} testungen={bisZu(alle, testung)} wahl={verlaufWahl} setWahl={setVerlaufWahl} />
          )}
        </div>

        <div className="aktionen">
          <button type="button" className="knopf knopf-haupt" onClick={() => window.print()}>
            <span>Drucken / Als PDF speichern</span>
          </button>
          <span className="hinweis-leise">Im Druckdialog als Ziel „Als PDF speichern“ wählen; „Kopf- und Fußzeilen“ ausschalten.</span>
        </div>
      </div>

      {arzt ? (
        <ArztAnsicht patient={patient} testung={testung} alle={alle} name={name} verlaufWahl={verlaufWahl} meloqAuswahl={meloqAuswahl} />
      ) : (
        <PatAnsicht patient={patient} testung={testung} name={name} />
      )}
    </section>
  )
}

/**
 * Fußzeile auf jeder gedruckten Seite: Kürzel, Bericht, Datum, „Seite x von y“ – nie der Name (Bericht-Audit Punkt 18).
 * Über @page-Randfelder; Chrome und Edge drucken sie, Safari lässt sie weg.
 */
function Fusszeile({ text }: { text: string }) {
  const sicher = text.replace(/[\\"]/g, '')
  return (
    <style>{`@media print { @page { @bottom-center { content: "${sicher} · Seite " counter(page) " von " counter(pages); font-family: Barlow, Arial, sans-serif; font-size: 8pt; color: #56606d; } } }`}</style>
  )
}

/** Testungen bis einschließlich dieser (nach Datum) – spätere gehören nicht in den Bericht. */
const bisZu = (alle: Testung[], t: Testung) => alle.filter((x) => x.id === t.id || x.datum <= t.datum)

function VerlaufWahl({ patient, testungen, wahl, setWahl }: { patient: Patient; testungen: Testung[]; wahl: string; setWahl: (w: string) => void }) {
  const optionen = verfuegbareOptionen(patient, testungen)
  if (optionen.length === 0) return null
  return (
    <label className="feld">
      <span className="feld-label">Diagramm im Verlauf</span>
      <select value={waehleOption(optionen, wahl).id} onChange={(e) => setWahl(e.target.value)}>
        {optionen.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  )
}

/** gewähltes Diagramm, sonst Knie-Extension (HHD), sonst das erste mit Werten */
const waehleOption = <T extends { id: string }>(optionen: T[], wahl: string): T =>
  optionen.find((o) => o.id === wahl) ?? optionen.find((o) => o.id === 'hhd_knie_ext') ?? optionen[0]

function BewertungMarke({ b }: { b: Bewertung }) {
  return (
    <span className={`bericht-ampel ampel-${b.ampel ?? 'offen'}`}>
      {b.ampel && <span aria-hidden="true">{AMPEL_ZEICHEN[b.ampel]} </span>}
      {b.text}
    </span>
  )
}

function Kopf({ titel, kuerzel, name, datum, unter }: { titel: string; kuerzel: string; name: string; datum: string; unter: string }) {
  return (
    <header className="bericht-kopf">
      <div className="bericht-marke">
        <img src={logoUrl} alt={PRAXIS} className="bericht-logo" />
        <div>
          <p className="bericht-praxis">{PRAXIS}</p>
          <h1 className="bericht-titel">{titel}</h1>
          <p className="bericht-unter">{unter}</p>
        </div>
      </div>
      <dl className="bericht-wer">
        <dt>Kürzel</dt>
        <dd>{kuerzel}</dd>
        {name.trim() && (
          <>
            <dt>Name</dt>
            <dd className="bericht-name">{name.trim()}</dd>
          </>
        )}
        <dt>Datum der Testung</dt>
        <dd>{datum}</dd>
      </dl>
    </header>
  )
}

function Entwurf() {
  return <p className="bericht-entwurf">ENTWURF – Testung nicht abgeschlossen</p>
}

function Fuss() {
  return <p className="bericht-fuss">{HINWEIS}.</p>
}

// ---------- Arztbericht ----------

function ArztAnsicht({
  patient,
  testung,
  alle,
  name,
  verlaufWahl,
  meloqAuswahl,
}: {
  patient: Patient
  testung: Testung
  alle: Testung[]
  name: string
  verlaufWahl: string
  meloqAuswahl: ReturnType<typeof useMeloqAuswahl>
}) {
  const b: ArztBericht = useMemo(() => arztBericht(patient, testung, meloqAuswahl), [patient, testung, meloqAuswahl])
  const bis = bisZu(alle, testung)
  const tabelle = verlaufTabelle(patient, bis, testung)

  return (
    <article className="bericht bericht-arzt" aria-label="Arztbericht">
      <Kopf titel="Arztbericht Return-to-Sport" kuerzel={b.kuerzel} name={name} datum={b.datum} unter={`${b.artText} nach VKB-Verletzung`} />
      {b.entwurf && <Entwurf />}

      <section className="bericht-abschnitt">
        <h2>Stammdaten</h2>
        <dl className="bericht-stamm">
          {b.stammdaten.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          <div>
            <dt>Phase</dt>
            <dd>
              {b.phase.name}
              {b.phase.uebersteuert !== null && <strong className="bericht-markiert"> – übersteuert: {b.phase.uebersteuert}</strong>}
            </dd>
          </div>
        </dl>
      </section>

      {b.rts && (
        <section className="bericht-abschnitt bericht-rts">
          <h2>RTS-Vorschlag und Entscheidung</h2>
          <div className="bericht-rts-raster">
            <div className="bericht-rts-feld">
              <span className="bericht-rts-label">Vorschlag der App</span>
              <strong>{b.rts.vorschlag}</strong>
            </div>
            <div className="bericht-rts-feld">
              <span className="bericht-rts-label">Beurteilung der Therapeut:in</span>
              {b.rts.entscheidung ? (
                <>
                  <strong>{b.rts.entscheidung.ergebnis}</strong>
                  <span>{b.rts.entscheidung.text}</span>
                  {b.rts.entscheidung.begruendung && <span>Begründung: {b.rts.entscheidung.begruendung}</span>}
                </>
              ) : (
                <span>noch offen (Testung nicht abgeschlossen)</span>
              )}
            </div>
          </div>
          <p className="bericht-hinweis-stark">Ersetzt keine ärztliche Freigabe.</p>
          {b.rts.aclRsiWarnung && <p className="bericht-warnung">⚠ {b.rts.aclRsiWarnung} – blockiert den Vorschlag nicht.</p>}
          {b.rts.wasFehlt.length > 0 && (
            <>
              <h3>Was fehlt noch?</h3>
              <ul>
                {b.rts.wasFehlt.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </>
          )}
          {b.rts.wuenschenswert.length > 0 && (
            <>
              <h3>Wünschenswert, nicht erreicht (blockiert nicht)</h3>
              <ul className="bericht-leise">
                {b.rts.wuenschenswert.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </>
          )}
          {b.rts.hinweise.length > 0 && (
            <ul className="bericht-leise">
              {b.rts.hinweise.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="bericht-abschnitt">
        <h2>Ergebnisse</h2>
        <p className="bericht-leise">
          Bewertet mit den Schwellen der Phase {b.phase.name}. LSI = betroffen / gesund × 100 (Zeit-Tests umgekehrt). Ampel: ✓ erfüllt · ~ knapp · ✗ nicht erfüllt.
        </p>
        <table className="bericht-tabelle">
          <thead>
            <tr>
              <th>Test / Kriterium</th>
              <th>Status</th>
              <th>Wert</th>
              <th>Ziel</th>
              <th>Bewertung</th>
              <th>Quelle</th>
            </tr>
          </thead>
          {b.bloecke.map((block) => (
            <tbody key={block.block}>
              <tr className="bericht-block-zeile">
                <th colSpan={6}>{block.name}</th>
              </tr>
              {block.tests.map((t) => (
                <ArztTestZeilen key={t.test.id} t={t} />
              ))}
            </tbody>
          ))}
        </table>
        <p className="bericht-leise">
          Meloq-Werte vom gewerteten Versuch (größte Sprunghöhe); O = Output, D = Driver, S = Strategy – ohne Ampel. {MELOQ.nichtMessbar}
        </p>
      </section>

      <VerlaufAbschnitt patient={patient} testungen={bis} tabelle={tabelle} wahl={verlaufWahl} />

      <section className="bericht-abschnitt bericht-unterschrift">
        <div>
          <span className="bericht-linie" />
          <span>Ort, Datum</span>
        </div>
        <div>
          <span className="bericht-linie" />
          <span>Unterschrift Therapeut:in{b.therapeut && ` (${b.therapeut})`}</span>
        </div>
      </section>
      {b.abgeschlossenAm && <p className="bericht-leise">Testung abgeschlossen am {b.abgeschlossenAm}.</p>}

      <Methodik protokolle={b.protokolle} endtestung={b.rts !== null} />
      <RohdatenAnhang rohdaten={b.rohdaten} />
      <Fuss />
    </article>
  )
}

// ---------- Anhang (Bericht-Audit Punkte 8 und 9) ----------

const QUELLEN = [
  'Read P. Practitioner’s Guide to ACL. VALD, 2024 (Seitenangaben „Read S. …“; Schwellen je Phase S. 59).',
  'Aspetar ACL Rehabilitation Protocol.',
  'ACL Injuries Part 2 Handbook (Clinical Physio).',
  'VALD Research Normative Data Report – ACL.',
  'Hawkin Dynamics, ODS System; McMahon et al., Strength Cond J 2021 (Output / Driver / Strategy).',
]

function Methodik({ protokolle, endtestung }: { protokolle: ArztBericht['protokolle']; endtestung: boolean }) {
  const r = KATALOG.regeln
  return (
    <section className="bericht-abschnitt bericht-anhang">
      <h2>Anhang: Methodik und Definitionen</h2>
      <dl className="bericht-methodik">
        <dt>Ablauf</dt>
        <dd>
          <ul>
            {protokolle.map((p) => (
              <li key={p.name}>
                <strong>{p.name}:</strong> {p.ablauf} <span className="bericht-quelle">({p.quelle})</span>
              </li>
            ))}
          </ul>
          Tatsächlicher Winkel, Boxhöhe, Eingabe-Einheit und Hebelarm stehen beim jeweiligen Test („Protokoll“).
        </dd>
        <dt>Gewerteter Versuch</dt>
        <dd>
          Bestwert aus bis zu {r.versucheJeSeite} Versuchen je Seite (6 m Hop: schnellster). Kraftmessplatte: der Versuch mit der größten Sprunghöhe zählt mit allen
          seinen Werten.
        </dd>
        <dt>LSI</dt>
        <dd>
          betroffen / gesund × 100 (6 m Hop: gesund / betroffen × 100). Bewertung: ✓ ab {r.lsi.gruenAb} %, ~ {r.lsi.gelbAb}–unter {r.lsi.gruenAb} %, ✗ unter {r.lsi.gelbAb} % ({r.lsi.quelle}).
        </dd>
        <dt>Asymmetrie</dt>
        <dd>
          wie Meloq: (stärker − schwächer) / stärker × 100. Die Formel kennt keine Richtung, darum steht beim Wert, welche Seite schwächer ist. Sie ist nicht dasselbe
          wie 100 − LSI.
        </dd>
        <dt>Relative Werte</dt>
        <dd>
          N/kg = Kraft in kg × {r.erdbeschleunigung.toLocaleString('de-AT')} / Körpergewicht · Ns/kg = Impuls in kg·s × {r.erdbeschleunigung.toLocaleString('de-AT')} / Körpergewicht · Nm/kg = Kraft in N × Hebelarm in m / Körpergewicht.
        </dd>
        <dt>Rundung</dt>
        <dd>Bewertet wird die angezeigte, gerundete Zahl (89,96 % → 90,0 % → ✓).</dd>
        <dt>Streuung</dt>
        <dd>
          Variationskoeffizient (CV) = Standardabweichung der Versuche / Mittelwert × 100, ab 2 Versuchen. Über {r.variationskoeffizientWarnungUeber} % (
          {r.variationskoeffizientQuelle}) ist der Wert mit Vorsicht zu interpretieren.
        </dd>
        <dt>Schwellen</dt>
        <dd>
          Je Phase nach Read (S. 59); eine Phase ohne eigenen Wert übernimmt den der Phase davor. Read-Bereiche sind 95-%-Konfidenzintervalle, teils aus
          unveröffentlichten Daten, „for guidance only“ und nicht nach Geschlecht getrennt (Schwelle = untere bzw. obere Grenze). {r.frauenHinweis}
        </dd>
        <dt>Sprunghöhe</dt>
        <dd>Meloq berechnet sie aus der Flugzeit, VALD (Read-Referenz) aus dem Impuls – Abweichungen sind möglich. {MELOQ.nichtMessbar}</dd>
        {endtestung && (
          <>
            <dt>RTS-Vorschlag</dt>
            <dd>
              „Kriterien erfüllt“ nur, wenn alle Pflicht-Kriterien ✓ sind und mindestens {r.rts.mindestMonate} Monate seit der OP vergangen sind ({r.rts.quelle}).
              Die Therapeut:in bestätigt oder überstimmt mit Begründung. Ersetzt keine ärztliche Freigabe.
            </dd>
          </>
        )}
        <dt>Quellen</dt>
        <dd>
          <ul>
            {QUELLEN.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </dd>
      </dl>
    </section>
  )
}

const zahlRoh = (v: number | null, einheit: string) => (v === null ? '–' : v.toLocaleString('de-AT', { maximumFractionDigits: einheit === 's' ? 2 : 1 }))

function RohdatenAnhang({ rohdaten }: { rohdaten: RohTest[] }) {
  if (rohdaten.length === 0) return null
  return (
    <section className="bericht-abschnitt">
      <h2>Anhang: Rohdaten</h2>
      <table className="bericht-tabelle bericht-roh">
        <thead>
          <tr>
            <th>Test</th>
            <th>Seite</th>
            <th className="bericht-zahl">Versuch 1</th>
            <th className="bericht-zahl">Versuch 2</th>
            <th className="bericht-zahl">Versuch 3</th>
            <th className="bericht-zahl">CV</th>
          </tr>
        </thead>
        <tbody>
          {rohdaten.flatMap((t) =>
            t.zeilen.map((z, zi) => (
              <tr key={`${t.id}-${z.seite}`}>
                {zi === 0 && (
                  <td rowSpan={t.zeilen.length}>
                    {t.name}
                    <br />
                    <span className="bericht-leise">
                      {t.einheit} · gewertet: {t.gewertet}
                    </span>
                  </td>
                )}
                <td className="bericht-roh-seite">{z.seite}</td>
                {z.werte.map((w, i) => (
                  <td key={i} className="bericht-zahl">
                    {i === z.gewertet ? <strong>{zahlRoh(w, t.einheit)}</strong> : zahlRoh(w, t.einheit)}
                  </td>
                ))}
                <td className="bericht-zahl">
                  {z.cv === null ? '–' : z.cvHoch ? <strong>{`${z.cv.toLocaleString('de-AT', { maximumFractionDigits: 1 })} % !`}</strong> : `${z.cv.toLocaleString('de-AT', { maximumFractionDigits: 1 })} %`}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
      <p className="bericht-leise">
        Fett = gewerteter Versuch. CV mit „!“ = über {KATALOG.regeln.variationskoeffizientWarnungUeber} % ({KATALOG.regeln.variationskoeffizientQuelle}) – Wert mit Vorsicht interpretieren.
      </p>
    </section>
  )
}

const ODS_KURZ = { output: 'O', driver: 'D', strategy: 'S' } as const

function ArztTestZeilen({ t }: { t: ArztBericht['bloecke'][number]['tests'][number] }) {
  if (!t.gemessen) {
    return (
      <tr className="bericht-test-zeile">
        <th scope="row">{t.test.name}</th>
        <td colSpan={5} className="bericht-leise">
          nicht gemessen
        </td>
      </tr>
    )
  }
  return (
    <>
      <tr className="bericht-test-zeile">
        <th scope="row" colSpan={6}>
          {t.test.name}
          {t.seiten && <span className="bericht-seiten"> – {t.seiten}</span>}
          {t.ausserhalbTestset && <span className="bericht-leise"> (nicht im Testset der Phase)</span>}
          {t.protokoll.length > 0 && (
            <span className="bericht-protokoll">
              Protokoll:{' '}
              {t.protokoll.map((p, i) => (
                <span key={p.text}>
                  {i > 0 && ' · '}
                  {p.abweichend ? <strong>{p.text}</strong> : p.text}
                </span>
              ))}
            </span>
          )}
        </th>
      </tr>
      {t.kriterien.map((k) => (
        <tr key={k.bezeichnung}>
          <td className="bericht-einrueck">{k.bezeichnung}</td>
          <td>{k.status}</td>
          <td className="bericht-zahl">
            {k.wert}
            {k.wertHinweis && (
              <>
                <br />
                <span className="bericht-leise">{k.wertHinweis}</span>
              </>
            )}
          </td>
          <td className="bericht-zahl">{k.ziel}</td>
          <td>
            <BewertungMarke b={k.bewertung} />
          </td>
          <td className="bericht-quelle">{k.quelle}</td>
        </tr>
      ))}
      {t.meloq.map((m) => (
        <tr key={m.name} className="bericht-meloq">
          <td className="bericht-einrueck">
            <span className="bericht-ods">{ODS_KURZ[m.ods]}</span> {m.name}
          </td>
          <td>Meloq</td>
          <td colSpan={2}>{m.wert}</td>
          <td>{m.vergleich || '–'}</td>
          <td className="bericht-quelle">ohne Ampel</td>
        </tr>
      ))}
      {t.klinischAnders && (
        <tr className="bericht-markiert-zeile">
          <td colSpan={6}>
            <strong>Klinisch anders beurteilt:</strong> {t.klinischAnders.urteil} – {t.klinischAnders.begruendung}
          </td>
        </tr>
      )}
      {t.zusatz.length > 0 && (
        <tr>
          <td colSpan={6} className="bericht-einrueck bericht-leise">
            {t.zusatz.join(' · ')}
          </td>
        </tr>
      )}
    </>
  )
}

function VerlaufAbschnitt({ patient, testungen, tabelle, wahl }: { patient: Patient; testungen: Testung[]; tabelle: VerlaufTabelle; wahl: string }) {
  const optionen = verfuegbareOptionen(patient, testungen)
  const option = optionen.length > 0 ? waehleOption(optionen, wahl) : undefined
  const v = option ? verlaufsDiagramme(patient, testungen, option) : null

  return (
    <section className="bericht-abschnitt bericht-verlauf">
      <h2>Verlauf</h2>
      {tabelle.spalten.length < 2 && <p className="bericht-leise">Bisher nur diese Testung – noch kein Verlauf.</p>}
      {tabelle.zeilen.length > 0 && (
        <table className="bericht-tabelle bericht-verlauf-tabelle">
          <thead>
            <tr>
              <th>Pflicht-Test (Wert)</th>
              {tabelle.spalten.map((s, i) => (
                <th key={i} className="bericht-zahl">
                  {s.datum}
                  <br />
                  <span className="bericht-leise">{s.phase}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabelle.zeilen.map((z) => (
              <tr key={z.name}>
                <td>
                  {z.name}
                  {z.kriterium && <span className="bericht-leise"> ({z.kriterium})</span>}
                </td>
                {z.werte.map((w, i) => (
                  <td key={i} className="bericht-zahl">
                    {w.wert}
                    {w.ziel && (
                      <>
                        <br />
                        <span className="bericht-leise">Ziel {w.ziel}</span>
                      </>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tabelle.zeilen.length > 0 && (
        <p className="bericht-leise">✓ ~ ✗ jeweils nach dem Ziel der Phase dieser Testung – ändert sich das Ziel, steht es unter dem Wert.</p>
      )}
      {v && v.punkte.length > 1 && (
        <div className="bericht-diagramme">
          {v.diagramme.map((d) => (
            <LinienDiagramm key={d.titel} {...d} />
          ))}
        </div>
      )}
    </section>
  )
}

// ---------- Pat./Trainer-Bericht ----------

function PatAnsicht({ patient, testung, name }: { patient: Patient; testung: Testung; name: string }) {
  const b: PatBericht = useMemo(() => patBericht(patient, testung), [patient, testung])
  return (
    <article className="bericht bericht-pat" aria-label="Pat./Trainer-Bericht">
      <Kopf titel="Bericht für Pat. und Trainer:in" kuerzel={b.kuerzel} name={name} datum={b.datum} unter={`${b.artText} · ${b.phase}`} />
      {b.entwurf && <Entwurf />}

      {b.ergebnis && (
        <div className="bericht-ergebnis">
          <span className="bericht-rts-label">Ergebnis der Testung (Beurteilung der Therapeut:in)</span>
          <strong>{b.ergebnis}</strong>
          <span>Ersetzt keine ärztliche Freigabe – die Rückkehr in den Sport besprechen Sie bitte mit Ihrer Ärztin / Ihrem Arzt.</span>
        </div>
      )}

      {b.klinik && <p className="bericht-klinik">{b.klinik}</p>}

      <section className="bericht-abschnitt">
        <h2>Leistung</h2>
        <table className="bericht-tabelle bericht-pat-tabelle">
          <thead>
            <tr>
              <th>Test</th>
              <th className="bericht-zahl">gesundes Bein</th>
              <th className="bericht-zahl">betroffenes Bein</th>
              <th className="bericht-zahl">betroffen in % von gesund</th>
              <th>Bewertung</th>
            </tr>
          </thead>
          <tbody>
            {b.zeilen.map((z) => (
              <tr key={z.id}>
                <td>{z.name}</td>
                {z.wert !== null ? (
                  <td colSpan={2} className="bericht-zahl">
                    {z.wertArt === 'unterschied' ? 'Unterschied zwischen den Beinen' : 'beidbeinig'}: {z.wert}
                  </td>
                ) : (
                  <>
                    <td className="bericht-zahl">{z.gesund}</td>
                    <td className="bericht-zahl">{z.betroffen}</td>
                  </>
                )}
                <td className="bericht-zahl">{z.lsi === null ? '–' : `${z.lsi.toLocaleString('de-AT')} %`}</td>
                <td>
                  <BewertungMarke b={z.bewertung} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {b.zeilen.length === 0 && <p className="bericht-leise">Noch keine Leistungstests erfasst.</p>}
      </section>

      <div className="bericht-pat-unten">
        <section className="bericht-abschnitt">
          <h2>Seitenvergleich</h2>
          <Spinnennetz achsen={b.netz} />
        </section>
        <section className="bericht-abschnitt">
          <h2>Was fehlt noch?</h2>
          {b.wasFehlt.length > 0 ? (
            <ul>
              {b.wasFehlt.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : (
            <p>Alle Pflicht-Kriterien dieser Testung sind erreicht.</p>
          )}
          {b.hinweise.map((h) => (
            <p key={h} className="bericht-leise">
              {h}
            </p>
          ))}
          <p className="bericht-leise">Ziel ist meist, dass das betroffene Bein mindestens 90 % des gesunden schafft.</p>
        </section>
      </div>
      <Fuss />
    </article>
  )
}
