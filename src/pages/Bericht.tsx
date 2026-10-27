import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { AMPEL_ZEICHEN, arztBericht, patBericht, verlaufTabelle, type ArztBericht, type Bewertung, type PatBericht, type PatZeile, type VerlaufTabelle } from '../berichte/bericht'
import LsiUebersicht from '../berichte/LsiUebersicht'
import { lsiUebersicht } from '../berichte/lsiZeilen'
import Spinnennetz from '../berichte/Spinnennetz'
import { db, type Testung } from '../db'
import Laedt from '../Laedt'
import { MELOQ } from '../katalog/meloq'
import { HINWEIS } from '../navigation'
import { datumDeutsch, type Patient } from '../patienten/stammdaten'
import { KATALOG, testNach } from '../katalog'
import type { RohTest } from '../berichte/nachvollziehbarkeit'
import { NORMDATEN } from '../testung/normdaten'
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
        <PatAnsicht patient={patient} testung={testung} alle={alle} name={name} />
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

/** Ampel als Chip wie im Designsystem: Zeichen + Wort, Ampelfarbe, Fläche 12 % (Bericht-Redesign) */
function BewertungMarke({ b }: { b: Bewertung }) {
  return (
    <span className={`bericht-chip ampel-${b.ampel ?? 'offen'}`}>
      {b.ampel && <span aria-hidden="true">{AMPEL_ZEICHEN[b.ampel]} </span>}
      {b.text}
    </span>
  )
}

// ---------- gemeinsame Bausteine (Bericht-Redesign, Muster 27.10.2026) ----------

/** Strichsymbole wie in der Seitenleiste (Strich 1,6) */
const SYMBOLE = {
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c.8-3.6 3.9-6 7.5-6s6.7 2.4 7.5 6',
  datum: 'M5.5 5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3.5 10h17M8 3v4M16 3v4',
  phase: 'M3 19h5v-5h5V9h5V4h3',
  zeit: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM12 7.5V12l3 2',
  seite: 'M10 3c0 4 1 6 1 9s-2 5-2 8M14 3c0 4 1 6 1 9s-1 5 1 8',
  graft: 'M6 18 18 6M6 15.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM18 3.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z',
  liste: 'M9 6h11M9 12h11M9 18h11M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17',
  kreis: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM8 12h8',
  info: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM12 11v5M12 8h.01',
} as const
type SymbolName = keyof typeof SYMBOLE

function Symbol({ name }: { name: SymbolName }) {
  return (
    <svg viewBox="0 0 24 24" className="bericht-symbol" aria-hidden="true">
      <path d={SYMBOLE[name]} />
    </svg>
  )
}

type KontextEintrag = [label: string, wert: string, symbol: SymbolName]

function Kopf({ titel, kuerzel, name, unter, entwurf, kontext }: { titel: string; kuerzel: string; name: string; unter: string; entwurf: boolean; kontext: KontextEintrag[] }) {
  return (
    <header className="bericht-kopf">
      <div className="bericht-kopfzeile">
        <div className="bericht-marke">
          <img src={logoUrl} alt={PRAXIS} className="bericht-logo" />
          <span className="bericht-praxis">{PRAXIS}</span>
        </div>
        <div className="bericht-art">
          {titel}
          {entwurf && <span className="bericht-entwurf">ENTWURF – Testung nicht abgeschlossen</span>}
        </div>
      </div>
      <div className="bericht-titelzeile">
        <h1 className="bericht-titel">{kuerzel}</h1>
        {name.trim() && (
          <span className="bericht-name">
            <Symbol name="person" />
            {name.trim()}
          </span>
        )}
        {unter && <span className="bericht-unter">{unter}</span>}
      </div>
      <dl className="bericht-kontext">
        {kontext.map(([k, v, s]) => (
          <div key={k}>
            <Symbol name={s} />
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </header>
  )
}

/** Abschnitt mit Titelzeile über die volle Breite; die Nummer dient zum Verweisen („siehe 4“). */
function Abschnitt({ nr, titel, notiz, className, children }: { nr: string | number; titel: string; notiz?: string; className?: string; children: ReactNode }) {
  return (
    <section className={`bericht-abschnitt${className ? ` ${className}` : ''}`}>
      <div className="bericht-abschnitt-kopf">
        <span className="bericht-nr">{nr}</span>
        <h2>{titel}</h2>
        {notiz && <p>{notiz}</p>}
      </div>
      {children}
    </section>
  )
}

function Tafel({ titel, symbol, className, children }: { titel?: string; symbol?: SymbolName; className?: string; children: ReactNode }) {
  return (
    <div className={`bericht-tafel bericht-tafel-innen${className ? ` ${className}` : ''}`}>
      {titel && (
        <h3 className="bericht-tafel-titel">
          {symbol && <Symbol name={symbol} />}
          {titel}
        </h3>
      )}
      {children}
    </div>
  )
}

function Fuss() {
  return <p className="bericht-fuss">{HINWEIS}.</p>
}

/** „Titel: Text“ → [Titel, Text]; ohne Doppelpunkt [null, Text] – nur für die Darstellung, der Text bleibt gleich. */
function teile(text: string): [string | null, string] {
  const i = text.indexOf(': ')
  return i < 0 ? [null, text] : [text.slice(0, i), text.slice(i + 2)]
}

/** „12 von 13 Pflicht-Tests erfüllt“ mit großen Zahlen – gleicher Text. */
function Zaehlung({ text }: { text: string }) {
  const m = /^(\d+) von (\d+) (.+)$/.exec(text)
  if (!m) return <strong className="bericht-zaehlung">{text}</strong>
  return (
    <strong className="bericht-zaehlung">
      {m[1]} <small>von</small> {m[2]} <small>{m[3]}</small>
    </strong>
  )
}

const KONTEXT_ARZT: [string, SymbolName][] = [
  ['Zeit bis zur Testung', 'zeit'],
  ['Betroffene Seite', 'seite'],
  ['Graft', 'graft'],
]
const STAMM_BREIT = ['Tegner vor Verletzung', 'Tegner aktuell', 'Begleit-OP', 'Phase']

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
  const pat: PatBericht = useMemo(() => patBericht(patient, testung, alle), [patient, testung, alle])
  const lsi = lsiUebersicht(b, pat)
  const bis = bisZu(alle, testung)
  const tabelle = verlaufTabelle(patient, bis, testung)
  // Quellen als Fußnoten statt eigener Spalte (Bericht-Audit Punkt 12): Nummer in Reihenfolge des ersten Auftretens
  const quellen = [...new Set(b.bloecke.flatMap((x) => x.tests.flatMap((t) => (t.gemessen ? t.kriterien.map((k) => k.quelle) : []))).filter((q) => q && q !== '–'))]
  const quelleNr = (q: string) => (quellen.includes(q) ? quellen.indexOf(q) + 1 : null)

  const stamm = Object.fromEntries(b.stammdaten)
  const kontext: KontextEintrag[] = [
    ['Datum der Testung', b.datum, 'datum'],
    ['Phase', b.phase.name, 'phase'],
    ...KONTEXT_ARZT.filter(([k]) => stamm[k]).map(([k, s]): KontextEintrag => [k, stamm[k], s]),
  ]
  const imKopf = kontext.map(([k]) => k)
  // Nummern laufen mit, auch wenn die LSI-Übersicht fehlt
  const nrLsi = lsi.length > 0 ? 2 : null
  const nrStamm = nrLsi ? 3 : 2
  const nrErgebnisse = nrStamm + 1
  const nrVerlauf = nrErgebnisse + 1
  const nrUnterschrift = nrVerlauf + 1

  return (
    <article className="bericht bericht-arzt" aria-label="Arztbericht">
      <Kopf titel="Arztbericht Return-to-Sport" kuerzel={b.kuerzel} name={name} unter={`${b.artText} nach VKB-Verletzung`} entwurf={b.entwurf} kontext={kontext} />

      {!b.rts && (
        <Abschnitt nr={1} titel={b.stand.titel} notiz="Verlaufstest – Ziele der Phase nach Read, kein RTS-Vorschlag.">
          <div className="bericht-tafel bericht-beurteilung">
            <div className="bericht-stand">
              <div>
                <Zaehlung text={b.stand.zeile.split(' · ')[0]} />
                {b.stand.zeile.includes(' · ') && <span className="bericht-leise">{b.stand.zeile.split(' · ').slice(1).join(' · ')}</span>}
              </div>
            </div>
          </div>
          {(b.stand.offen.length > 0 || b.stand.nichtGemessen.length > 0) && (
            <div className="bericht-fehlt">
              {b.stand.offen.length > 0 && (
                <Tafel titel="Nicht erfüllt" symbol="liste">
                  <ul>
                    {b.stand.offen.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </Tafel>
              )}
              {b.stand.nichtGemessen.length > 0 && (
                <Tafel className="bericht-leise">
                  <p>Nicht gemessen: {b.stand.nichtGemessen.join(', ')}</p>
                </Tafel>
              )}
            </div>
          )}
          {b.stand.aclRsiWarnung && <p className="bericht-warnung">⚠ {b.stand.aclRsiWarnung}</p>}
        </Abschnitt>
      )}

      {b.rts && (
        <Abschnitt nr={1} titel="RTS-Vorschlag und Entscheidung" notiz={`Grau hinterlegt = Einschätzung. Messwerte ab Abschnitt ${nrLsi ?? nrErgebnisse}.`}>
          <div className="bericht-tafel bericht-beurteilung">
            <div className="bericht-stand bericht-stand-drei">
              <div>
                <Zaehlung text={b.stand.zeile.split(' · ')[0]} />
                {b.stand.zeile.includes(' · ') && <span className="bericht-leise">{b.stand.zeile.split(' · ').slice(1).join(' · ')}</span>}
              </div>
              <div>
                <span className="bericht-label">Vorschlag der App</span>
                <strong>{b.rts.vorschlag}</strong>
              </div>
              <div>
                <span className="bericht-label">Beurteilung der Therapeut:in</span>
                {b.rts.entscheidung ? (
                  <>
                    <strong>{b.rts.entscheidung.ergebnis}</strong>
                    <span>{b.rts.entscheidung.text}</span>
                    {b.rts.entscheidung.begruendung && <span>Begründung: {b.rts.entscheidung.begruendung}</span>}
                  </>
                ) : (
                  <span className="bericht-offen">noch offen (Testung nicht abgeschlossen)</span>
                )}
              </div>
            </div>
          </div>
          {(b.rts.wasFehlt.length > 0 || b.rts.wuenschenswert.length > 0) && (
            <div className="bericht-fehlt">
              {b.rts.wasFehlt.length > 0 && (
                <Tafel titel="Was fehlt noch?" symbol="liste">
                  <ul>
                    {b.rts.wasFehlt.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </Tafel>
              )}
              {b.rts.wuenschenswert.length > 0 && (
                <Tafel titel="Wünschenswert, nicht erreicht (blockiert nicht)" symbol="kreis" className="bericht-leise">
                  <ul>
                    {b.rts.wuenschenswert.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </Tafel>
              )}
            </div>
          )}
          {b.rts.hinweise.length > 0 && (
            <ul className="bericht-hinweise bericht-leise">
              {b.rts.hinweise.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          {b.rts.aclRsiWarnung && <p className="bericht-warnung">⚠ {b.rts.aclRsiWarnung} – blockiert den Vorschlag nicht.</p>}
          <p className="bericht-hinweis-stark">Ersetzt keine ärztliche Freigabe.</p>
        </Abschnitt>
      )}

      {nrLsi && (
        <Abschnitt
          nr={nrLsi}
          titel="Seitenvergleich auf einen Blick"
          notiz={`LSI = betroffen / gesund × 100 (6 m Hop umgekehrt). Ohne LSI: Klinik, CMJ-Asymmetrie, IMTP, Fragebögen – siehe ${nrErgebnisse}.`}
        >
          <div className="bericht-tafel bericht-tafel-innen">
            <LsiUebersicht zeilen={lsi} vorigeDatum={pat.vorigeDatum} />
          </div>
        </Abschnitt>
      )}

      <Abschnitt nr={nrStamm} titel="Stammdaten">
        <dl className="bericht-stamm">
          {/* was schon in der Kontextleiste im Kopf steht, nicht wiederholen */}
          {/* breite Felder (Tegner, Begleit-OP) ans Ende, damit die Zeilen voll werden */}
          {[...b.stammdaten.filter(([k]) => !imKopf.includes(k) && !STAMM_BREIT.includes(k)), ...b.stammdaten.filter(([k]) => !imKopf.includes(k) && STAMM_BREIT.includes(k))].map(([k, v]) => (
            <div key={k} className={STAMM_BREIT.includes(k) ? 'bericht-breit' : undefined}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          {b.phase.uebersteuert !== null && (
            <div className="bericht-breit">
              <dt>Phase</dt>
              <dd>
                {b.phase.name}
                <strong className="bericht-markiert"> – übersteuert: {b.phase.uebersteuert}</strong>
              </dd>
            </div>
          )}
        </dl>
      </Abschnitt>

      <Abschnitt
        nr={nrErgebnisse}
        titel="Ergebnisse"
        className="bericht-lang bericht-neue-seite"
        notiz={`Bewertet mit den Schwellen der Phase ${b.phase.name}. LSI = betroffen / gesund × 100 (Zeit-Tests umgekehrt). Ampel: ✓ erfüllt · ~ knapp · ✗ nicht erfüllt. Ohne Zusatz = Pflicht.`}
      >
        <div className="bericht-tafel bericht-tafel-lang">
          <table className="bericht-tabelle bericht-ergebnis">
            <colgroup>
              <col style={{ width: '36%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Test / Kriterium</th>
                <th className="bericht-zahl">gesund</th>
                <th className="bericht-zahl">betroffen</th>
                <th className="bericht-zahl">Wert</th>
                <th className="bericht-zahl">Ziel</th>
                <th>Bewertung</th>
              </tr>
            </thead>
            {b.bloecke.map((block) => (
              <tbody key={block.block}>
                <tr className="bericht-block-zeile">
                  <th colSpan={SPALTEN}>{block.name}</th>
                </tr>
                {block.tests.map((t) => (
                  <ArztTestZeilen key={t.test.id} t={t} quelleNr={quelleNr} />
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <p className="bericht-leise bericht-klein">
          Meloq-Werte vom gewerteten Versuch (größte Sprunghöhe); O = Output, D = Driver, S = Strategy – ohne Ampel. {MELOQ.nichtMessbar}
        </p>
        {quellen.length > 0 && (
          <>
            <h3 className="bericht-unterkopf">Quellen der Ziele</h3>
            <ol className="bericht-quellen">
              {quellen.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </>
        )}
      </Abschnitt>

      <VerlaufAbschnitt nr={nrVerlauf} patient={patient} testungen={bis} tabelle={tabelle} wahl={verlaufWahl} />

      <Abschnitt nr={nrUnterschrift} titel="Bestätigung" className="bericht-unterschrift-abschnitt">
        <div className="bericht-unterschrift">
          <div>
            <span className="bericht-linie" />
            <span>Ort, Datum</span>
          </div>
          <div>
            <span className="bericht-linie" />
            <span>Unterschrift Therapeut:in{b.therapeut && ` (${b.therapeut})`}</span>
          </div>
        </div>
        {b.abgeschlossenAm && <p className="bericht-leise">Testung abgeschlossen am {b.abgeschlossenAm}.</p>}
      </Abschnitt>

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
    <Abschnitt nr="A" titel="Anhang: Methodik und Definitionen" className="bericht-lang bericht-anhang">
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
        <dt>Vergleichswerte</dt>
        <dd>
          LSI zur Vorverletzung: betroffen im Verhältnis zum eingetragenen Wert vor der Verletzung, ohne Ampel. Normdaten „typisch nach VKB-OP“ (VALD Research
          Normative Data Report, Mittelwert ± 1 SD) stehen nur, wenn Geschlecht, Altersband und Zeitpunkt (6 / 9 / 12 Monate, ± {NORMDATEN.toleranzMonate.toLocaleString('de-AT')}{' '}
          Monate) genau passen – ohne Einfluss auf die Bewertung.
        </dd>
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
    </Abschnitt>
  )
}

const zahlRoh = (v: number | null, einheit: string) => (v === null ? '–' : v.toLocaleString('de-AT', { maximumFractionDigits: einheit === 's' ? 2 : 1 }))

function RohdatenAnhang({ rohdaten }: { rohdaten: RohTest[] }) {
  if (rohdaten.length === 0) return null
  return (
    <Abschnitt nr="B" titel="Anhang: Rohdaten" className="bericht-lang" notiz={`Fett = gewerteter Versuch. CV mit „!“ = über ${KATALOG.regeln.variationskoeffizientWarnungUeber} % (${KATALOG.regeln.variationskoeffizientQuelle}) – Wert mit Vorsicht interpretieren.`}>
      <div className="bericht-tafel bericht-tafel-lang">
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
                    <td rowSpan={t.zeilen.length} className="bericht-roh-test">
                      {t.name}
                      <span className="bericht-protokoll">
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
      </div>
    </Abschnitt>
  )
}

const ODS_KURZ = { output: 'O', driver: 'D', strategy: 'S' } as const
/** Spalten der Ergebnistabelle: Test/Kriterium | gesund | betroffen | Wert | Ziel | Bewertung – Quelle als Fußnote beim Ziel (Bericht-Audit Punkt 12) */
const SPALTEN = 6

function ArztTestZeilen({ t, quelleNr }: { t: ArztBericht['bloecke'][number]['tests'][number]; quelleNr: (q: string) => number | null }) {
  if (!t.gemessen) {
    return (
      <tr className="bericht-test-zeile">
        <th scope="row">{t.test.name}</th>
        <td colSpan={SPALTEN - 1} className="bericht-leise">
          nicht gemessen
        </td>
      </tr>
    )
  }
  const sp = t.seitenSpalten
  return (
    <>
      <tr className="bericht-test-zeile">
        <th scope="row">
          {t.test.name}
          {t.ausserhalbTestset && <span className="bericht-tag"> (nicht im Testset der Phase)</span>}
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
        <td className="bericht-zahl bericht-gesund">
          {sp?.gesund}
          {sp?.gesundEingabe && <span className="bericht-eingabe">{sp.gesundEingabe}</span>}
        </td>
        <td className="bericht-zahl bericht-betroffen">
          {sp?.betroffen}
          {sp?.betroffenEingabe && <span className="bericht-eingabe">{sp.betroffenEingabe}</span>}
        </td>
        <td colSpan={3} />
      </tr>
      {t.kriterien.map((k) => (
        <tr key={k.bezeichnung} className="bericht-krit">
          <td colSpan={3}>
            {k.bezeichnung}
            {k.status !== 'Pflicht' && <span className="bericht-tag">{k.status}</span>}
          </td>
          <td className="bericht-zahl">
            {k.wert}
            {k.wertHinweis && <span className="bericht-eingabe">{k.wertHinweis}</span>}
          </td>
          <td className="bericht-zahl">
            {k.ziel}
            {quelleNr(k.quelle) !== null && <sup className="bericht-fussnote">{quelleNr(k.quelle)}</sup>}
          </td>
          <td className="bericht-bewertung">
            <BewertungMarke b={k.bewertung} />
          </td>
        </tr>
      ))}
      {t.meloq.length > 0 && (
        <tr className="bericht-meloq-kopf">
          <td colSpan={SPALTEN}>Meloq-Werte (gewerteter Versuch) – ohne Ampel</td>
        </tr>
      )}
      {t.meloq.map((m) => (
        <tr key={m.name} className="bericht-meloq">
          <td>
            <span className="bericht-ods">{ODS_KURZ[m.ods]}</span> {m.name}
          </td>
          <td colSpan={3} className="bericht-meloq-wert">
            {m.wert}
          </td>
          <td colSpan={2}>{m.vergleich || '–'}</td>
        </tr>
      ))}
      {t.normdaten && (
        <tr className="bericht-unterzeile bericht-normdaten">
          <td colSpan={SPALTEN}>{t.normdaten}</td>
        </tr>
      )}
      {t.klinischAnders && (
        <tr className="bericht-markiert-zeile">
          <td colSpan={SPALTEN}>
            <strong>Klinisch anders beurteilt:</strong> {t.klinischAnders.urteil} – {t.klinischAnders.begruendung}
          </td>
        </tr>
      )}
      {t.zusatz.length > 0 && (
        <tr className="bericht-unterzeile">
          <td colSpan={SPALTEN}>{t.zusatz.join(' · ')}</td>
        </tr>
      )}
    </>
  )
}

/** Zellwert „83,3 % ~“: Zahl fett, Zeichen in Ampelfarbe – gleicher Text. */
const ZEICHEN_AMPEL: Record<string, string> = { '✓': 'gruen', '~': 'gelb', '✗': 'rot' }
function VerlaufWert({ wert }: { wert: string }) {
  const m = /^(.*) ([✓~✗])$/.exec(wert)
  if (!m) return <span className={wert === '–' ? 'bericht-leise' : undefined}>{wert}</span>
  return (
    <>
      <strong>{m[1]}</strong> <span className={`bericht-zeichen ampel-${ZEICHEN_AMPEL[m[2]]}`}>{m[2]}</span>
    </>
  )
}

function VerlaufAbschnitt({ nr, patient, testungen, tabelle, wahl }: { nr: number; patient: Patient; testungen: Testung[]; tabelle: VerlaufTabelle; wahl: string }) {
  const optionen = verfuegbareOptionen(patient, testungen)
  const option = optionen.length > 0 ? waehleOption(optionen, wahl) : undefined
  const v = option ? verlaufsDiagramme(patient, testungen, option) : null
  const mitVeraenderung = tabelle.spalten.length >= 2

  return (
    <Abschnitt
      nr={nr}
      titel="Verlauf"
      className="bericht-lang bericht-verlauf"
      notiz={
        tabelle.zeilen.length > 0
          ? `✓ ~ ✗ jeweils nach dem Ziel der Phase dieser Testung – ändert sich das Ziel, steht es unter dem Wert.${mitVeraenderung ? ' Veränderung: rohe Differenz der angezeigten Werte zur vorigen Testung mit Wert (Pkt. = Prozentpunkte), ohne Angabe zum Messfehler.' : ''}`
          : undefined
      }
    >
      {tabelle.spalten.length < 2 && <p className="bericht-leise">Bisher nur diese Testung – noch kein Verlauf.</p>}
      {tabelle.zeilen.length > 0 && (
        <div className="bericht-tafel bericht-tafel-lang">
          <table className="bericht-tabelle bericht-verlauf-tabelle">
            <thead>
              <tr>
                <th>
                  Pflicht-Test<small>Kriterium</small>
                </th>
                {tabelle.spalten.map((s, i) => (
                  <th key={i} className="bericht-zahl">
                    {s.datum}
                    <small>{s.phase}</small>
                  </th>
                ))}
                {mitVeraenderung && (
                  <th className="bericht-zahl">
                    Veränderung<small>zur vorigen Testung</small>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tabelle.zeilen.map((z) => (
                <tr key={z.name}>
                  <td>
                    <strong>{z.name}</strong>
                    {z.kriterium && <span className="bericht-eingabe bericht-links">{z.kriterium}</span>}
                  </td>
                  {z.werte.map((w, i) => (
                    <td key={i} className="bericht-zahl">
                      <VerlaufWert wert={w.wert} />
                      {w.seiten && <span className="bericht-eingabe">{w.seiten}</span>}
                      {w.ziel && <span className="bericht-eingabe">Ziel {w.ziel}</span>}
                    </td>
                  ))}
                  {mitVeraenderung && (
                    <td className="bericht-zahl bericht-veraenderung">
                      {z.veraenderung ? (
                        <>
                          <strong>{z.veraenderung.split(' · ')[0]}</strong>
                          {z.veraenderung.includes(' · ') && <span className="bericht-eingabe">{z.veraenderung.split(' · ').slice(1).join(' · ')}</span>}
                        </>
                      ) : (
                        '–'
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tabelle.zeilen.length > 0 && <p className="bericht-leise bericht-klein">b = betroffen, g = gesund (Kraft in N/kg).</p>}
      {v && v.punkte.length > 1 && (
        <div className="bericht-diagramme">
          {v.diagramme.map((d) => (
            <div key={d.titel} className="bericht-tafel bericht-tafel-innen">
              <LinienDiagramm {...d} />
            </div>
          ))}
        </div>
      )}
    </Abschnitt>
  )
}

// ---------- Pat./Trainer-Bericht ----------

/** Gruppen der Werte-Liste in Alltagssprache; IMTP (Kraftmessplatte) zählt zur Kraft. */
const GRUPPEN: { name: string; bloecke: readonly string[] }[] = [
  { name: 'Kraft', bloecke: ['hhd'] },
  { name: 'Kraftausdauer', bloecke: ['kraftausdauer'] },
  { name: 'Sprünge', bloecke: ['platten', 'hops'] },
]
const gruppeVon = (z: PatZeile) => {
  const id = z.id.split(':')[0]
  if (id === 'imtp') return 'Kraft'
  const block = testNach(id)?.block
  return GRUPPEN.find((g) => block && g.bloecke.includes(block))?.name ?? 'Sprünge'
}

const prozent = (v: number) => `${v.toLocaleString('de-AT')} %`

function PatWert({ z }: { z: PatZeile }) {
  const unter = z.wert !== null ? (z.wertArt === 'unterschied' ? `Unterschied zwischen den Beinen: ${z.wert}` : 'beidbeinig') : `gesund ${z.gesund} · betroffen ${z.betroffen}`
  return (
    <div className="bericht-wert">
      <div className="bericht-wert-name">
        {z.name}
        <small>{unter}</small>
      </div>
      <div className={`bericht-wert-zahl${z.lsi === null ? ' bericht-wert-ohne' : ''}`}>{z.lsi !== null ? prozent(z.lsi) : z.wertArt === 'beidbeinig' ? z.wert : ''}</div>
      <div className="bericht-wert-rechts">
        <BewertungMarke b={z.bewertung} />
        {z.vorige !== null && <small>zuvor {prozent(z.vorige)}</small>}
        {z.vorverletzung !== null && <small>vor der Verletzung: {prozent(z.vorverletzung)}</small>}
      </div>
    </div>
  )
}

function PatAnsicht({ patient, testung, alle, name }: { patient: Patient; testung: Testung; alle: Testung[]; name: string }) {
  const b: PatBericht = useMemo(() => patBericht(patient, testung, alle), [patient, testung, alle])
  const [, erreicht] = b.erreicht ? teile(b.erreicht) : [null, '']
  const zaehlung = /^(\d+ von \d+) (.+)$/.exec(erreicht)
  const [klinikLabel, klinikWert] = b.klinik ? teile(b.klinik) : [null, '']
  const gruppen = GRUPPEN.map((g) => ({ name: g.name, zeilen: b.zeilen.filter((z) => gruppeVon(z) === g.name) })).filter((g) => g.zeilen.length > 0)

  return (
    <article className="bericht bericht-pat" aria-label="Pat./Trainer-Bericht">
      <Kopf
        titel="Bericht für Pat. und Trainer:in"
        kuerzel={b.kuerzel}
        name={name}
        unter=""
        entwurf={b.entwurf}
        kontext={[
          ['Datum der Testung', b.datum, 'datum'],
          ['Testung', b.artText, 'liste'],
          ['Phase', b.phase, 'phase'],
        ]}
      />

      {(b.erreicht || b.klinik) && (
        <div className="bericht-band">
          {b.erreicht && (
            <div>
              <p className="bericht-label">{teile(b.erreicht)[0] ?? ''}:</p>
              {zaehlung ? (
                <p className="bericht-band-zahl">
                  <b>{zaehlung[1]}</b> <span>{zaehlung[2]}</span>
                </p>
              ) : (
                <p className="bericht-band-text">{erreicht}</p>
              )}
            </div>
          )}
          {b.klinik && (
            <div>
              {klinikLabel && <p className="bericht-label">{klinikLabel}:</p>}
              <p className="bericht-band-text">{klinikWert}</p>
            </div>
          )}
        </div>
      )}

      <div className="bericht-pat-mitte">
        <section>
          <h2>Seitenvergleich</h2>
          <Spinnennetz achsen={b.netz} vorigeDatum={b.vorigeDatum} />
        </section>
        <section className="bericht-pat-rechts">
          <Tafel titel={b.wasFehltTitel} symbol="liste" className="bericht-pat-fehlt">
            {b.wasFehlt.length > 0 ? (
              <ul>
                {b.wasFehlt.map((w) => {
                  const [kopf, text] = teile(w)
                  return (
                    <li key={w}>
                      {kopf && <b>{kopf}</b>}
                      {text}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p>Alle Pflicht-Kriterien dieser Testung sind erreicht.</p>
            )}
          </Tafel>
          {b.hinweise.map((h) => {
            const [kopf, text] = teile(h)
            return (
              <Tafel key={h} titel={kopf ?? undefined} symbol="info" className="bericht-pat-hinweis">
                <p>{text}</p>
              </Tafel>
            )
          })}
          {b.ergebnis && (
            <div className="bericht-tafel bericht-tafel-innen bericht-beurteilung bericht-pat-ergebnis">
              <span className="bericht-label">Ergebnis der Testung (Beurteilung der Therapeut:in)</span>
              <strong>{b.ergebnis}</strong>
              <span>Ersetzt keine ärztliche Freigabe – die Rückkehr in den Sport besprechen Sie bitte mit Ihrer Ärztin / Ihrem Arzt.</span>
            </div>
          )}
        </section>
      </div>

      <section className="bericht-werte">
        <div className="bericht-werte-kopf">
          <h2>Ihre Werte</h2>
          <p>betroffenes Bein in % vom gesunden{b.vorigeDatum && b.zeilen.some((z) => z.vorige !== null) ? ` · „zuvor“ = letzte Testung vom ${b.vorigeDatum}` : ''}</p>
        </div>
        {b.zeilen.length === 0 ? (
          <p className="bericht-leise">Noch keine Leistungstests erfasst.</p>
        ) : (
          <div className="bericht-werte-raster">
            {gruppen.map((g) => (
              <div key={g.name} className="bericht-gruppe">
                <h3>{g.name}</h3>
                {g.zeilen.map((z) => (
                  <PatWert key={z.id} z={z} />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="bericht-lesehilfe">
        <div>
          <b>100 %</b>so viel wie das gesunde Bein
        </div>
        <div>
          <b>Ziel</b>meist mindestens 90 %
        </div>
        <div>
          <b>✓ ~ ✗</b>erfüllt · knapp · nicht erfüllt
        </div>
        {b.vorigeDatum && (
          <div>
            <b>zuvor</b>letzte Testung ({b.vorigeDatum})
          </div>
        )}
      </div>
      <Fuss />
    </article>
  )
}
