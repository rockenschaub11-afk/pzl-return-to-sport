import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, loescheTestung, speichereTestung, type Testung } from '../db'
import { KATALOG, protokollNach } from '../katalog'
import { BLOCK_NAMEN, BLOECKE, type TestDef } from '../katalog/typen'
import { datumDeutsch, monateSeit, TEGNER_STUFEN, type Patient } from '../patienten/stammdaten'
import { bewerteTest, type TestErgebnis } from '../rechnen/bewertung'
import { ENDTESTUNG_PHASE, ENDTESTUNG_TESTS, sichtbareTests } from '../testung/ablauf'
import { berechne, hatEingabe, parseZahl, type Berechnung } from '../testung/erfassung'
import { AmpelMarke } from '../testung/Ladebalken'
import { useMeloqAuswahl } from '../testung/meloqAuswahl'
import TestKarte, { type Seitennamen } from '../testung/TestKarte'

const SPEICHER_VERZOEGERUNG_MS = 400

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
  const auswertung = useMemo(() => {
    const m = new Map<string, { berechnung: Berechnung; ergebnis: TestErgebnis }>()
    if (!testung) return m
    for (const t of ENDTESTUNG_TESTS) {
      const berechnung = berechne(t, testung.eingaben[t.id] ?? {}, { koerpergewichtKg: kg })
      m.set(t.id, { berechnung, ergebnis: bewerteTest(t, ENDTESTUNG_PHASE, berechnung.werte, { geschlecht: patient?.geschlecht }) })
    }
    return m
  }, [testung, kg, patient?.geschlecht])

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
  if (!testung || !patient) return null

  const seiten = seitennamen(patient)
  const sichtbar = sichtbareTests(testung)
  const aendern = (teil: Partial<Testung>) => setTestung((t) => (t ? { ...t, ...teil } : t))
  const setzeFeld = (testId: string) => (feld: string, wert: string) =>
    setTestung((t) => (t ? { ...t, eingaben: { ...t.eingaben, [testId]: { ...t.eingaben[testId], [feld]: wert } } } : t))
  const optionalHinzu = (testId: string) => aendern({ optionaleTests: [...testung.optionaleTests, testId] })
  const optionalWeg = (testId: string) => aendern({ optionaleTests: testung.optionaleTests.filter((o) => o !== testId) })
  const kgFehlt = kg === null || kg <= 0
  const monate = monateSeit(patient.opDatum)
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

      <nav className="block-sprung" aria-label="Blöcke">
        {BLOECKE.map((b) => (
          <a key={b} href={`#block-${b}`} onClick={(e) => springen(e, `block-${b}`)}>
            {BLOCK_NAMEN[b].replace(/ \(.*\)$/, '')}
          </a>
        ))}
      </nav>

      <div className="testung-raster">
        <div className="testung-haupt">
          {BLOECKE.map((block) => {
            const imBlock = ENDTESTUNG_TESTS.filter((t) => t.block === block)
            const anzeigen = imBlock.filter((t) => sichtbar.includes(t))
            const verfuegbar = imBlock.filter((t) => t.optional && !sichtbar.includes(t))
            return (
              <div key={block} id={`block-${block}`} className="testung-block">
                <h3 className="testung-block-titel">{BLOCK_NAMEN[block]}</h3>
                {anzeigen.map((t) => {
                  const a = auswertung.get(t.id)!
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
            Gesamtbewertung („Kriterien erfüllt“) folgt in Etappe 6. Bewertet mit {KATALOG.phasen.find((p) => p.id === ENDTESTUNG_PHASE)?.lang}.
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
function springen(e: React.MouseEvent, ziel: string) {
  e.preventDefault()
  document.getElementById(ziel)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function seitennamen(p: Patient): Seitennamen {
  const betroffen = p.seite === 'links' ? 'links' : 'rechts'
  const gesund = betroffen === 'links' ? 'rechts' : 'links'
  return { gesund: `Gesund (${gesund})`, betroffen: `Betroffen (${betroffen})` }
}
