import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, loescheTestung, speichereEinstellung, speichereTestung, type Entscheidung, type Testung } from '../db'
import { KATALOG, protokollNach } from '../katalog'
import { BLOCK_NAMEN, BLOECKE, type TestDef } from '../katalog/typen'
import { datumDeutsch, monateSeit, TEGNER_STUFEN, type Patient } from '../patienten/stammdaten'
import type { TestErgebnis } from '../rechnen/bewertung'
import { ENDTESTUNG_PHASE, ENDTESTUNG_TESTS, sichtbareTests, werteAus, type TestAuswertung } from '../testung/ablauf'
import ErgebnisEntscheidung from '../testung/ErgebnisEntscheidung'
import { hatEingabe, parseZahl } from '../testung/erfassung'
import KlinischAnders from '../testung/KlinischAnders'
import { pflichtStatus, rtsVorschlag } from '../testung/rts'
import RtsKasten from '../testung/RtsKasten'
import { AmpelMarke } from '../testung/Ladebalken'
import { useMeloqAuswahl } from '../testung/meloqAuswahl'
import TestKarte, { type Seitennamen } from '../testung/TestKarte'

const SPEICHER_VERZOEGERUNG_MS = 400
const THERAPEUT_SCHLUESSEL = 'therapeutKuerzel'

export default function TestungErfassen() {
  const { id } = useParams()
  const navigate = useNavigate()
  // null = gibt es nicht, undefined = lädt noch
  const gespeichert = useLiveQuery(async () => (id ? ((await db.testungen.get(id)) ?? null) : null), [id])
  const patient = useLiveQuery(() => (gespeichert ? db.patienten.get(gespeichert.patientId) : undefined), [gespeichert?.patientId])
  const [testung, setTestung] = useState<Testung | null>(null)
  const [speichert, setSpeichert] = useState(false)
  const [loeschenFragen, setLoeschenFragen] = useState(false)
  const zuletzt = useRef<string>('')
  const meloqAuswahl = useMeloqAuswahl()
  const therapeutStandard = useLiveQuery(async () => ((await db.einstellungen.get(THERAPEUT_SCHLUESSEL))?.wert as string | undefined) ?? '', [])

  // einmal laden – danach ist der lokale Stand führend
  useEffect(() => {
    if (gespeichert && (!testung || testung.id !== gespeichert.id)) {
      setTestung(gespeichert)
      zuletzt.current = JSON.stringify(gespeichert)
    }
  }, [gespeichert, testung])

  // automatisch speichern, kurz nach der letzten Eingabe
  useEffect(() => {
    if (!testung) return
    const stand = JSON.stringify(testung)
    if (stand === zuletzt.current) return
    setSpeichert(true)
    const t = setTimeout(async () => {
      await speichereTestung(testung)
      zuletzt.current = stand
      setSpeichert(false)
    }, SPEICHER_VERZOEGERUNG_MS)
    return () => clearTimeout(t)
  }, [testung])

  const kg = parseZahl(testung?.koerpergewichtKg)
  const auswertung = useMemo(() => (testung ? werteAus(testung, patient?.geschlecht) : new Map()), [testung, patient?.geschlecht])
  const vorschlag = useMemo(() => (testung && patient ? rtsVorschlag(testung, patient, auswertung) : null), [testung, patient, auswertung])

  if (gespeichert === undefined) return null
  if (gespeichert === null) {
    return (
      <div className="karte">
        <p>Diese Testung gibt es nicht (mehr).</p>
        <Link to="/testung" className="knopf">
          <span>Zur Übersicht</span>
        </Link>
      </div>
    )
  }
  if (!testung || !patient || !vorschlag) return null

  const seiten = seitennamen(patient)
  const sichtbar = sichtbareTests(testung)
  const aendern = (teil: Partial<Testung>) => setTestung((t) => (t ? { ...t, ...teil } : t))
  const setzeFeld = (testId: string) => (feld: string, wert: string) =>
    setTestung((t) => (t ? { ...t, eingaben: { ...t.eingaben, [testId]: { ...t.eingaben[testId], [feld]: wert } } } : t))
  const optionalHinzu = (testId: string) => aendern({ optionaleTests: [...testung.optionaleTests, testId] })
  const optionalWeg = (testId: string) => aendern({ optionaleTests: testung.optionaleTests.filter((o) => o !== testId) })
  const kgFehlt = kg === null || kg <= 0
  const monate = monateSeit(patient.opDatum)
  const abgeschlossen = testung.status === 'abgeschlossen'
  const entscheidung: Entscheidung = testung.entscheidung ?? { art: '', begruendung: '', therapeut: therapeutStandard ?? '' }

  function abschliessen() {
    aendern({
      status: 'abgeschlossen',
      abgeschlossenAm: new Date().toISOString(),
      entscheidung: { ...entscheidung, vorschlagBeiAbschluss: vorschlag!.erfuellt ? 'erfuellt' : 'nicht_erfuellt' },
    })
    speichereEinstellung(THERAPEUT_SCHLUESSEL, entscheidung.therapeut.trim())
    springen(null, 'ergebnis')
  }

  function wiederOeffnen() {
    aendern({ status: 'in_arbeit', abgeschlossenAm: undefined, entscheidung: { art: '', begruendung: '', therapeut: entscheidung.therapeut } })
  }
  const allgemein = protokollNach('allgemein')

  async function loeschen() {
    if (!testung) return
    await loescheTestung(testung.id)
    navigate(`/patienten/${patient!.id}`)
  }

  return (
    <section>
      <div className="seitenkopf">
        <div>
          <p className="seitenzusatz">
            <Link to={`/patienten/${patient.id}`}>← {patient.kuerzel}</Link>
          </p>
          <h2 className="seitentitel">Endtestung {patient.kuerzel}</h2>
          <p className="seitenzusatz">
            Betroffen: {patient.seite === 'links' ? 'links' : 'rechts'} · {patient.konservativ ? 'Verletzung' : 'OP'} {datumDeutsch(patient.opDatum)}
            {monate !== null && ` (${monate} Monate)`} · Bewertung mit den Schwellen „&gt; 9 Monate“
          </p>
        </div>
        <span className={`speicher-status${speichert ? ' speicher-laeuft' : ''}`} aria-live="polite">
          {speichert ? 'speichert …' : '✓ gespeichert'}
        </span>
      </div>

      {abgeschlossen && (
        <p className="meldung meldung-info testung-gesperrt">
          Abgeschlossen am {testung.abgeschlossenAm ? datumDeutsch(testung.abgeschlossenAm.slice(0, 10)) : '–'} – schreibgeschützt. Zum Ändern unten
          „Wieder öffnen“.
        </p>
      )}

      {/* abgeschlossen = schreibgeschützt: fieldset sperrt alle Eingaben darin */}
      <fieldset disabled={abgeschlossen} className="ohne-rahmen">
      <div className="karte block testung-kopf">
        <div className="feld-reihe">
          <label className="feld">
            <span className="feld-label">Datum der Testung</span>
            <input type="date" value={testung.datum} onChange={(e) => aendern({ datum: e.target.value })} />
          </label>
          <label className={`feld${kgFehlt ? ' feld-fehler' : ''}`}>
            <span className="feld-label">
              Körpergewicht (kg) <span className="block-marke">Pflicht</span>
            </span>
            <input inputMode="decimal" value={testung.koerpergewichtKg} onChange={(e) => aendern({ koerpergewichtKg: e.target.value })} placeholder="z. B. 72,5" />
            {kgFehlt && <span className="feld-meldung">Ohne Körpergewicht keine N/kg- und Ns/kg-Werte.</span>}
          </label>
        </div>
        <label className="feld">
          <span className="feld-label">Tegner aktuell</span>
          <select value={testung.tegnerAktuell} onChange={(e) => aendern({ tegnerAktuell: e.target.value })}>
            <option value="">– keine Angabe –</option>
            {TEGNER_STUFEN.map((text, stufe) => (
              <option key={stufe} value={String(stufe)}>
                {stufe} – {text}
              </option>
            ))}
          </select>
          {patient.tegner !== '' && <span className="feld-hilfe">Vor der Verletzung: {patient.tegner}</span>}
        </label>
        {allgemein && (
          <p className="hinweis-leise">
            <strong>Allgemein:</strong> {allgemein.ablauf}
          </p>
        )}
      </div>
      </fieldset>

      <nav className="block-sprung" aria-label="Blöcke">
        {BLOECKE.map((b) => (
          <a key={b} href={`#block-${b}`} onClick={(e) => springen(e, `block-${b}`)}>
            {BLOCK_NAMEN[b].replace(/ \(.*\)$/, '')}
          </a>
        ))}
      </nav>

      <div className="testung-raster">
        <div className="testung-haupt">
          <fieldset disabled={abgeschlossen} className="ohne-rahmen">
          {BLOECKE.map((block) => {
            const imBlock = ENDTESTUNG_TESTS.filter((t) => t.block === block)
            const anzeigen = imBlock.filter((t) => sichtbar.includes(t))
            const verfuegbar = imBlock.filter((t) => t.optional && !sichtbar.includes(t))
            return (
              <div key={block} id={`block-${block}`} className="testung-block">
                <h3 className="testung-block-titel">{BLOCK_NAMEN[block]}</h3>
                {anzeigen.map((t) => {
                  const a = auswertung.get(t.id)! as TestAuswertung
                  return (
                    <div key={t.id} className="test-huelle">
                      <TestKarte
                        test={t}
                        eingabe={testung.eingaben[t.id] ?? {}}
                        setze={setzeFeld(t.id)}
                        seiten={seiten}
                        berechnung={a.berechnung}
                        ergebnis={a.ergebnis}
                        koerpergewichtFehlt={kgFehlt}
                        koerpergewichtKg={kg}
                        meloqAuswahl={meloqAuswahl}
                        fuss={(() => {
                          const p = pflichtStatus(a)
                          return p ? (
                            <KlinischAnders
                              wert={testung.klinischAnders?.[t.id]}
                              ampelStatus={p.status}
                              setze={(w) => aendern({ klinischAnders: { ...testung.klinischAnders, [t.id]: w } })}
                            />
                          ) : null
                        })()}
                      />
                      {t.optional && !hatEingabe(testung.eingaben[t.id]) && (
                        <button type="button" className="text-knopf test-entfernen" onClick={() => optionalWeg(t.id)}>
                          {t.name} wieder ausblenden
                        </button>
                      )}
                    </div>
                  )
                })}
                {verfuegbar.map((t) => (
                  <button key={t.id} type="button" className="knopf test-hinzu" onClick={() => optionalHinzu(t.id)}>
                    <span>+ {t.name} hinzufügen (optional)</span>
                  </button>
                ))}
              </div>
            )
          })}
          </fieldset>

          <ErgebnisEntscheidung
            testung={{ ...testung, entscheidung }}
            vorschlag={vorschlag}
            setzeEntscheidung={(e) => aendern({ entscheidung: e })}
            abschliessen={abschliessen}
            wiederOeffnen={wiederOeffnen}
          />

          <div className="aktionen testung-ende">
            <Link to={`/patienten/${patient.id}`} className="knopf">
              <span>Fertig für jetzt</span>
            </Link>
            {!loeschenFragen && (
              <button type="button" className="knopf knopf-gefahr aktionen-rechts" onClick={() => setLoeschenFragen(true)}>
                <span>Testung löschen …</span>
              </button>
            )}
          </div>
          {loeschenFragen && (
            <div className="meldung meldung-fehler loeschen-frage" role="alertdialog" aria-label="Löschen bestätigen">
              <p>Diese Endtestung vom {datumDeutsch(testung.datum)} mit allen Werten endgültig löschen?</p>
              <div className="aktionen">
                <button type="button" className="knopf knopf-gefahr" onClick={loeschen}>
                  <span>Ja, endgültig löschen</span>
                </button>
                <button type="button" className="knopf" onClick={() => setLoeschenFragen(false)}>
                  <span>Nein, behalten</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="testung-uebersicht" aria-label="Übersicht">
          <RtsKasten v={vorschlag} mindestMonate={KATALOG.regeln.rts.mindestMonate} onDetails={() => springen(null, 'ergebnis')} />
          <h3>Übersicht</h3>
          {BLOECKE.map((block) => {
            const tests = sichtbar.filter((t) => t.block === block)
            if (tests.length === 0) return null
            return (
              <div key={block}>
                <p className="uebersicht-block">{BLOCK_NAMEN[block].replace(/ \(.*\)$/, '')}</p>
                <ul>
                  {tests.map((t) => (
                    <UebersichtZeile key={t.id} test={t} ergebnis={auswertung.get(t.id)!.ergebnis} />
                  ))}
                </ul>
              </div>
            )
          })}
          <p className="uebersicht-fuss">
            Bewertet mit {KATALOG.phasen.find((p) => p.id === ENDTESTUNG_PHASE)?.lang}.
          </p>
        </aside>
      </div>
    </section>
  )
}

function UebersichtZeile({ test, ergebnis }: { test: TestDef; ergebnis: TestErgebnis }) {
  return (
    <li>
      <a href={`#test-${test.id}`} onClick={(e) => springen(e, `test-${test.id}`)}>
        <span className={`ampel-punkt ampel-${ergebnis.ampel ?? 'offen'}`} aria-hidden="true" />
        <span>{test.name}</span>
      </a>
      <AmpelMarke ampel={ergebnis.ampel} />
    </li>
  )
}

/** Sprungmarken ohne die Adresse (#/testung/…) zu verändern – HashRouter nutzt das # selbst. */
function springen(e: React.MouseEvent | null, ziel: string) {
  e?.preventDefault()
  document.getElementById(ziel)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function seitennamen(p: Patient): Seitennamen {
  const betroffen = p.seite === 'links' ? 'links' : 'rechts'
  const gesund = betroffen === 'links' ? 'rechts' : 'links'
  return { gesund: `Gesund (${gesund})`, betroffen: `Betroffen (${betroffen})` }
}
