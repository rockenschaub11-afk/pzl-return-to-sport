import { useLiveQuery } from 'dexie-react-hooks'
import Frage from '../Frage'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, loescheTestung, speichereEinstellung, speichereTestung, TestungKonfliktFehler, type Entscheidung, type Testung } from '../db'
import { KATALOG, phaseNach, protokollNach } from '../katalog'
import { BLOCK_NAMEN, BLOECKE, PHASEN_IDS, type PhaseId, type TestDef } from '../katalog/typen'
import { datumDeutsch, TEGNER_STUFEN, type Patient } from '../patienten/stammdaten'
import {
  ART_TEXT,
  hinzufuegbar,
  monateBisTestung,
  phasenStand,
  sichtbareTests,
  werteAus,
  wochenBisTestung,
  type TestAuswertung,
} from '../testung/ablauf'
import Laedt from '../Laedt'
import ErgebnisEntscheidung, { AbschlussVerlauf } from '../testung/ErgebnisEntscheidung'
import { hatEingabe, hqQuotient, istKeineZahl, parseZahl } from '../testung/erfassung'
import { kartenStatus, type KartenStatus } from '../testung/kartenStatus'
import { stammdatenHinweise } from '../testung/stammdatenHinweise'
import KlinischAnders from '../testung/KlinischAnders'
import { AmpelMarke } from '../testung/Ladebalken'
import { useMeloqAuswahl } from '../testung/meloqAuswahl'
import { normdatenFuer } from '../testung/normdaten'
import { boxTatsaechlich } from '../berichte/nachvollziehbarkeit'
import { pflichtStatus, rtsVorschlag } from '../testung/rts'
import RtsKasten from '../testung/RtsKasten'
import TestKarte, { type Seitennamen } from '../testung/TestKarte'

const SPEICHER_VERZOEGERUNG_MS = 400
const SPEICHER_WIEDERHOLUNG_MS = 3000
const THERAPEUT_SCHLUESSEL = 'therapeutKuerzel'

export default function TestungErfassen() {
  const { id } = useParams()
  const navigate = useNavigate()
  // null = gibt es nicht, undefined = lädt noch
  const gespeichert = useLiveQuery(async () => (id ? ((await db.testungen.get(id)) ?? null) : null), [id])
  const patient = useLiveQuery(() => (gespeichert ? db.patienten.get(gespeichert.patientId) : undefined), [gespeichert?.patientId])
  const [testung, setTestung] = useState<Testung | null>(null)
  const [speichert, setSpeichert] = useState(false)
  const [speicherFehler, setSpeicherFehler] = useState(false)
  const [versuch, setVersuch] = useState(0)
  /** noch nicht geschriebener Stand */
  const offen = useRef<Testung | null>(null)
  const [loeschenFragen, setLoeschenFragen] = useState(false)
  const zuletzt = useRef<string>('')
  /** geaendertAm des Stands in der Datenbank, auf dem die Eingaben hier beruhen */
  const basis = useRef<string>('')
  const [konflikt, setKonflikt] = useState(false)
  /** Schreibvorgänge nacheinander – sonst hielte ein zweiter, schneller Speichervorgang den eigenen ersten für ein fremdes Fenster */
  const kette = useRef<Promise<unknown>>(Promise.resolve())
  const schreiben = (stand: Testung) => {
    const lauf = kette.current.then(async () => {
      basis.current = await speichereTestung(stand, basis.current)
    })
    kette.current = lauf.catch(() => {})
    return lauf
  }
  // Beim Öffnen sind ruhige Karten zu; was hier angeklickt wird, gilt bis zum Verlassen. Eine gerade ausgefüllte Karte klappt nie von selbst zu.
  const startOffen = useRef<{ id: string; karten: Record<string, boolean> }>({ id: '', karten: {} })
  const [klappen, setKlappen] = useState<Record<string, boolean>>({})
  useEffect(() => setKlappen({}), [id])
  const meloqAuswahl = useMeloqAuswahl()
  const therapeutStandard = useLiveQuery(async () => ((await db.einstellungen.get(THERAPEUT_SCHLUESSEL))?.wert as string | undefined) ?? '', [])

  // einmal laden – danach ist der lokale Stand führend
  useEffect(() => {
    if (gespeichert && (!testung || testung.id !== gespeichert.id)) {
      setTestung(gespeichert)
      zuletzt.current = JSON.stringify(gespeichert)
      basis.current = gespeichert.geaendertAm
    }
  }, [gespeichert, testung])

  // automatisch speichern, kurz nach der letzten Eingabe; schlägt es fehl, sichtbar melden und wiederholen
  useEffect(() => {
    if (!testung || konflikt) return
    const stand = JSON.stringify(testung)
    if (stand === zuletzt.current) return
    offen.current = testung
    setSpeichert(true)
    const t = setTimeout(
      async () => {
        try {
          await schreiben(testung)
          zuletzt.current = stand
          if (offen.current === testung) offen.current = null
          setSpeicherFehler(false)
        } catch (err) {
          if (err instanceof TestungKonfliktFehler) {
            // nichts überschreiben – der Stand aus dem anderen Fenster bleibt erhalten
            offen.current = null
            setKonflikt(true)
          } else {
            setSpeicherFehler(true)
            setVersuch((v) => v + 1)
          }
        }
        setSpeichert(false)
      },
      speicherFehler ? SPEICHER_WIEDERHOLUNG_MS : SPEICHER_VERZOEGERUNG_MS,
    )
    return () => clearTimeout(t)
  }, [testung, versuch, konflikt, speicherFehler])

  // Was noch wartet, beim Verlassen der Seite sofort schreiben – auch beim Schließen des Fensters
  useEffect(() => {
    const sichern = () => {
      if (offen.current) void schreiben(offen.current).catch(() => {})
      offen.current = null
    }
    window.addEventListener('pagehide', sichern)
    return () => {
      window.removeEventListener('pagehide', sichern)
      sichern()
    }
  }, [id])

  const kg = parseZahl(testung?.koerpergewichtKg)
  const geladen = Boolean(testung && patient)
  const [aktiverBlock, setAktiverBlock] = useState<string | null>(null)
  useEffect(() => {
    if (!geladen || typeof IntersectionObserver === 'undefined') return
    const beobachter = new IntersectionObserver(
      (eintraege) => {
        for (const e of eintraege) if (e.isIntersecting) setAktiverBlock(e.target.id)
      },
      { rootMargin: '-90px 0px -75% 0px' },
    )
    document.querySelectorAll('.testung-block').forEach((b) => beobachter.observe(b))
    return () => beobachter.disconnect()
  }, [geladen])

  const ph = useMemo(() => (testung && patient ? phasenStand(testung, patient.opDatum) : null), [testung, patient])
  const auswertung = useMemo(
    () => (testung && ph ? werteAus(testung, ph.phase, patient?.geschlecht) : new Map<string, TestAuswertung>()),
    [testung, ph, patient?.geschlecht],
  )
  const vorschlag = useMemo(
    () => (testung && patient && ph?.art === 'endtestung' ? rtsVorschlag(testung, patient, auswertung, ph.phase) : null),
    [testung, patient, auswertung, ph],
  )

  if (gespeichert === undefined) return <Laedt zeilen={4} />
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
  if (!testung || !patient || !ph) return <Laedt zeilen={4} />

  const phase = ph.phase
  const seiten = seitennamen(patient)
  const sichtbar = sichtbareTests(testung, phase)
  const speicherText = konflikt
    ? '! nicht gespeichert – anderes Fenster'
    : speicherFehler
      ? '! nicht gespeichert – wird wiederholt'
      : speichert
        ? 'speichert …'
        : '✓ gespeichert'
  const statusVon = (id: string) => kartenStatus(auswertung.get(id)!.ergebnis, hatEingabe(testung.eingaben[id]))
  if (startOffen.current.id !== testung.id) startOffen.current = { id: testung.id, karten: {} }
  for (const t of sichtbar) {
    if (t.id in startOffen.current.karten) continue
    const eingabe = testung.eingaben[t.id] ?? {}
    // Streuung, ungültige Eingabe oder klinisch anders beurteilt: Karte bleibt offen, damit nichts untergeht
    const auffaellig =
      auswertung.get(t.id)!.berechnung.streuung.length > 0 ||
      Object.entries(eingabe).some(([k, v]) => k !== 'einheit' && k !== 'wert' && istKeineZahl(v)) ||
      !!testung.klinischAnders?.[t.id]
    startOffen.current.karten[t.id] = !statusVon(t.id).ruhig || auffaellig
  }
  const istOffen = (id: string) => klappen[id] ?? startOffen.current.karten[id] ?? true
  const zumHinzufuegen = hinzufuegbar(testung, phase)
  const aendern = (teil: Partial<Testung>) => setTestung((t) => (t ? { ...t, ...teil } : t))
  const setzeFeld = (testId: string) => (feld: string, wert: string) =>
    setTestung((t) => (t ? { ...t, eingaben: { ...t.eingaben, [testId]: { ...t.eingaben[testId], [feld]: wert } } } : t))
  const testHinzu = (testId: string) => aendern({ optionaleTests: [...testung.optionaleTests, testId] })
  const testWeg = (testId: string) => aendern({ optionaleTests: testung.optionaleTests.filter((o) => o !== testId) })
  const kgFehlt = kg === null || kg <= 0
  const monate = monateBisTestung(patient.opDatum, testung.datum)
  const wochen = wochenBisTestung(patient.opDatum, testung.datum)
  const hhdZuFrueh = wochen !== null && wochen < KATALOG.regeln.hhdAbWochen
  const allgemein = protokollNach('allgemein')
  const abgeschlossen = testung.status === 'abgeschlossen'
  const entscheidung: Entscheidung = testung.entscheidung ?? { art: '', begruendung: '', therapeut: therapeutStandard ?? '' }
  const uebersteuern = testung.phaseUebersteuert ?? { phase: '', begruendung: '' }

  function abschliessen() {
    aendern({
      status: 'abgeschlossen',
      abgeschlossenAm: new Date().toISOString(),
      // Phase und Art werden beim Abschluss festgeschrieben – Schwellen ändern sich nie rückwirkend
      phase,
      art: ph!.art,
      entscheidung: { ...entscheidung, vorschlagBeiAbschluss: vorschlag ? (vorschlag.erfuellt ? 'erfuellt' : 'nicht_erfuellt') : undefined },
    })
    speichereEinstellung(THERAPEUT_SCHLUESSEL, entscheidung.therapeut.trim())
    springen(null, 'ergebnis')
  }

  /** Nach einem Konflikt: den Stand aus der Datenbank übernehmen, die Eingaben hier seit dem letzten Speichern verwerfen. */
  async function neuLaden() {
    const aktuell = await db.testungen.get(testung!.id)
    setKonflikt(false)
    if (!aktuell) {
      navigate(`/patienten/${patient!.id}`)
      return
    }
    zuletzt.current = JSON.stringify(aktuell)
    basis.current = aktuell.geaendertAm
    setTestung(aktuell)
  }

  function wiederOeffnen() {
    aendern({ status: 'in_arbeit', abgeschlossenAm: undefined, entscheidung: { art: '', begruendung: '', therapeut: entscheidung.therapeut } })
  }

  async function loeschen() {
    if (!testung) return
    offen.current = null // sonst käme die Testung beim Verlassen der Seite zurück
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
          <h1 className="seitentitel">
            {ART_TEXT[ph.art]} {patient.kuerzel}
          </h1>
          <p className="seitenzusatz">
            Betroffen: {patient.seite === 'links' ? 'links' : 'rechts'} · {patient.konservativ ? 'Verletzung' : 'OP'} {datumDeutsch(patient.opDatum)}
            {monate !== null && ` · ${monate} Monate bis zur Testung`}
          </p>
        </div>
        <div className="testung-kopf-aktionen">
          <span className={`speicher-status${speichert && !konflikt ? ' speicher-laeuft' : ''}${speicherFehler || konflikt ? ' speicher-fehler' : ''}`} aria-live="polite">
            <span key={speicherText} className="speicher-wechsel">
              {speicherText}
            </span>
          </span>
          <Link to={`/berichte/${testung.id}/arzt`} className="knopf">
            <span>Bericht</span>
          </Link>
        </div>
      </div>

      {konflikt && (
        <div className="meldung meldung-fehler testung-konflikt" role="alert">
          <p>
            Diese Testung wurde inzwischen in einem anderen Fenster geändert. Damit nichts überschrieben wird, speichert dieses Fenster nicht mehr.
            Eingaben hier seit dem letzten „✓ gespeichert“ gehen beim Laden verloren.
          </p>
          <button type="button" className="knopf" onClick={neuLaden}>
            <span>Aktuellen Stand laden</span>
          </button>
        </div>
      )}

      {abgeschlossen && (
        <p className="meldung meldung-info testung-gesperrt">
          Abgeschlossen am {testung.abgeschlossenAm ? datumDeutsch(testung.abgeschlossenAm.slice(0, 10)) : '–'} – schreibgeschützt. Zum Ändern unten
          „Wieder öffnen“.
        </p>
      )}

      {/* abgeschlossen = schreibgeschützt: fieldset sperrt alle Eingaben darin */}
      <fieldset disabled={abgeschlossen} className="ohne-rahmen">
        <div className="karte block testung-kopf">
          <div className="phase-zeile">
            <span className="phase-marke">Phase: {phaseNach(phase).lang}</span>
            <span className="hinweis-leise">
              {ph.uebersteuert
                ? `übersteuert${ph.fix ? '' : ` (automatisch wäre: ${phaseNach(ph.automatisch).name})`}`
                : ph.fix
                  ? testung.phase === undefined
                    ? 'feste Phase (Testung vor Etappe 7)'
                    : 'beim Abschluss festgeschrieben'
                  : 'automatisch aus OP-Datum und Datum der Testung'}
            </span>
          </div>

          <div className="feld-reihe">
            <label className="feld">
              <span className="feld-label">Datum der Testung</span>
              <input type="date" value={testung.datum} onChange={(e) => aendern({ datum: e.target.value })} />
            </label>
            <label className={`feld${kgFehlt || istKeineZahl(testung.koerpergewichtKg) ? ' feld-fehler' : ''}`}>
              <span className="feld-label">
                Körpergewicht (kg) <span className="block-marke">Pflicht</span>
              </span>
              <input inputMode="decimal" value={testung.koerpergewichtKg} onChange={(e) => aendern({ koerpergewichtKg: e.target.value })} placeholder="z. B. 72,5" autoComplete="off" />
              {istKeineZahl(testung.koerpergewichtKg) ? <span className="feld-meldung">Das ist keine Zahl – bitte z. B. 72,5 eingeben.</span> : kgFehlt && <span className="feld-meldung">Ohne Körpergewicht keine N/kg- und Ns/kg-Werte.</span>}
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

          <details className="test-mehr" open={uebersteuern.phase !== ''}>
            <summary>Phase übersteuern</summary>
            <p className="hinweis-leise">Nur in Ausnahmefällen (z. B. verzögerter Verlauf, Re-OP). Wird im Bericht markiert.</p>
            <div className="feld-reihe">
              <label className="feld">
                <span className="feld-label">Phase</span>
                <select
                  value={uebersteuern.phase}
                  onChange={(e) => aendern({ phaseUebersteuert: { ...uebersteuern, phase: e.target.value as PhaseId | '' } })}
                >
                  <option value="">– automatisch ({phaseNach(ph.automatisch).name}) –</option>
                  {PHASEN_IDS.map((p) => (
                    <option key={p} value={p}>
                      {phaseNach(p).lang}
                    </option>
                  ))}
                </select>
              </label>
              {uebersteuern.phase !== '' && (
                <label className={`feld${uebersteuern.begruendung.trim() ? '' : ' feld-fehler'}`}>
                  <span className="feld-label">
                    Begründung <span className="block-marke">Pflicht</span>
                  </span>
                  <textarea
                    rows={2}
                    value={uebersteuern.begruendung}
                    onChange={(e) => aendern({ phaseUebersteuert: { ...uebersteuern, begruendung: e.target.value } })}
                  />
                  {!uebersteuern.begruendung.trim() && <span className="feld-meldung">Ohne Begründung gilt die automatische Phase.</span>}
                </label>
              )}
            </div>
          </details>

          {allgemein && (
            <p className="hinweis-leise">
              <strong>Allgemein:</strong> {allgemein.ablauf}
            </p>
          )}
        </div>
      </fieldset>

      <nav className="block-sprung" aria-label="Blöcke">
        <span className="sprung-kontext">
          <strong>{patient.kuerzel}</strong> · {ART_TEXT[ph.art]} · {phaseNach(phase).name}
          <span className={`sprung-speicher${speicherFehler || konflikt ? ' speicher-fehler' : ''}`}>
            <span key={speicherText} className="speicher-wechsel">
              {speicherText}
            </span>
          </span>
        </span>
        {BLOECKE.filter((b) => sichtbar.some((t) => t.block === b) || zumHinzufuegen.optional.some((t) => t.block === b)).map((b) => {
          const tests = sichtbar.filter((t) => t.block === b)
          const erfasst = tests.filter((t) => hatEingabe(testung.eingaben[t.id])).length
          return (
            <a key={b} href={`#block-${b}`} aria-current={aktiverBlock === `block-${b}` ? 'location' : undefined} onClick={(e) => springen(e, `block-${b}`)} aria-label={`${BLOCK_NAMEN[b].replace(/ \(.*\)$/, '')}: ${erfasst} von ${tests.length} erfasst`}>
              {BLOCK_NAMEN[b].replace(/ \(.*\)$/, '')}
              <span className={`sprung-zahl${erfasst === tests.length ? ' sprung-fertig' : ''}`}>
                {erfasst}/{tests.length}
              </span>
            </a>
          )
        })}
        {ph.art === 'endtestung' && (
          <a href="#ergebnis" onClick={(e) => springen(e, 'ergebnis')}>
            Abschluss
          </a>
        )}
      </nav>

      <div className="testung-raster">
        <div className="testung-haupt">
          <fieldset disabled={abgeschlossen} className="ohne-rahmen">
            {BLOECKE.map((block) => {
              const anzeigen = sichtbar.filter((t) => t.block === block)
              const optional = zumHinzufuegen.optional.filter((t) => t.block === block)
              if (anzeigen.length === 0 && optional.length === 0) return null
              return (
                <div key={block} id={`block-${block}`} className="testung-block">
                  <div className="testung-block-kopf">
                    <h2 className="testung-block-titel">{BLOCK_NAMEN[block]}</h2>
                    {anzeigen.length > 0 && (
                      <button type="button" className="knopf-leise" onClick={() => setKlappen((k) => ({ ...k, ...Object.fromEntries(anzeigen.map((t) => [t.id, !anzeigen.every((x) => istOffen(x.id))])) }))}>
                        {anzeigen.every((t) => istOffen(t.id)) ? 'Alle zuklappen' : 'Alle aufklappen'}
                      </button>
                    )}
                  </div>
                  {anzeigen.map((t) => {
                    const a = auswertung.get(t.id)!
                    const p = pflichtStatus(a)
                    const ausserhalb = !t.phasen.includes(phase)
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
                          hinweise={[
                            ...(t.messgeraet === 'dynamo' && hhdZuFrueh
                              ? [`Read: HHD-Krafttests erst ab ca. ${KATALOG.regeln.hhdAbWochen} Wochen post-OP – jetzt ${wochen} Wochen.`]
                              : []),
                            ...(ausserhalb ? [`Nicht im Testset der Phase „${phaseNach(phase).name}“ – zusätzlich hinzugefügt.`] : []),
                          ]}
                          infos={stammdatenHinweise(t.id, patient)}
                          hq={t.id === 'hhd_knie_flex' ? hqQuotient(a.berechnung, auswertung.get('hhd_knie_ext')?.berechnung) : null}
                          normdaten={normdatenFuer(t.id, patient, testung.datum, monate, boxTatsaechlich(t, testung.eingaben[t.id] ?? {}, testung.datum))}
                          datum={testung.datum}
                          status={statusVon(t.id)}
                          offen={istOffen(t.id)}
                          onKlappen={() => setKlappen((k) => ({ ...k, [t.id]: !istOffen(t.id) }))}
                          fuss={
                            p && ph.art === 'endtestung' ? (
                              <KlinischAnders
                                wert={testung.klinischAnders?.[t.id]}
                                ampelStatus={p.status}
                                setze={(w) => aendern({ klinischAnders: { ...testung.klinischAnders, [t.id]: w } })}
                              />
                            ) : null
                          }
                        />
                        {testung.optionaleTests.includes(t.id) && !hatEingabe(testung.eingaben[t.id]) && (
                          <button type="button" className="text-knopf test-entfernen" onClick={() => testWeg(t.id)}>
                            {t.name} wieder ausblenden
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {optional.map((t) => (
                    <button key={t.id} type="button" className="knopf test-hinzu" onClick={() => testHinzu(t.id)}>
                      <span>+ {t.name} hinzufügen (optional)</span>
                    </button>
                  ))}
                </div>
              )
            })}

            {zumHinzufuegen.weitere.length > 0 && (
              <label className="feld weitere-tests">
                <span className="feld-label">+ weiteren Test hinzufügen</span>
                <select value="" onChange={(e) => e.target.value && testHinzu(e.target.value)}>
                  <option value="">Test aus dem Katalog wählen …</option>
                  {BLOECKE.map((b) => {
                    const tests = zumHinzufuegen.weitere.filter((t) => t.block === b)
                    return tests.length === 0 ? null : (
                      <optgroup key={b} label={BLOCK_NAMEN[b]}>
                        {tests.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </label>
            )}
          </fieldset>

          {vorschlag ? (
            <ErgebnisEntscheidung
              testung={{ ...testung, entscheidung }}
              vorschlag={vorschlag}
              setzeEntscheidung={(e) => aendern({ entscheidung: e })}
              abschliessen={abschliessen}
              wiederOeffnen={wiederOeffnen}
            />
          ) : (
            <AbschlussVerlauf
              testung={{ ...testung, entscheidung }}
              setzeEntscheidung={(e) => aendern({ entscheidung: e })}
              abschliessen={abschliessen}
              wiederOeffnen={wiederOeffnen}
            />
          )}

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
            <Frage className="meldung meldung-fehler loeschen-frage" label="Löschen bestätigen" onAbbrechen={() => setLoeschenFragen(false)}>
              <p>
                {ART_TEXT[ph.art]} vom {datumDeutsch(testung.datum)} mit allen Werten endgültig löschen?
              </p>
              <div className="aktionen">
                <button type="button" className="knopf knopf-gefahr" onClick={loeschen}>
                  <span>Ja, endgültig löschen</span>
                </button>
                <button type="button" className="knopf" data-abbrechen onClick={() => setLoeschenFragen(false)}>
                  <span>Nein, behalten</span>
                </button>
              </div>
            </Frage>
          )}
        </div>

        <aside className="testung-uebersicht" aria-label="Übersicht">
          {vorschlag && <RtsKasten v={vorschlag} mindestMonate={KATALOG.regeln.rts.mindestMonate} onDetails={() => springen(null, 'ergebnis')} />}
          <h2>Übersicht</h2>
          {BLOECKE.map((block) => {
            const tests = sichtbar.filter((t) => t.block === block)
            if (tests.length === 0) return null
            return (
              <div key={block}>
                <p className="uebersicht-block">{BLOCK_NAMEN[block].replace(/ \(.*\)$/, '')}</p>
                <ul>
                  {tests.map((t) => (
                    <UebersichtZeile key={t.id} test={t} status={statusVon(t.id)} onOeffnen={() => setKlappen((k) => ({ ...k, [t.id]: true }))} />
                  ))}
                </ul>
              </div>
            )
          })}
          <p className="uebersicht-fuss">Bewertet mit den Schwellen der Phase {phaseNach(phase).lang}.</p>
        </aside>
      </div>
    </section>
  )
}

function UebersichtZeile({ test, status, onOeffnen }: { test: TestDef; status: KartenStatus; onOeffnen: () => void }) {
  return (
    <li>
      <a
        href={`#test-${test.id}`}
        onClick={(e) => {
          onOeffnen()
          springen(e, `test-${test.id}`)
        }}
      >
        <span>{test.name}</span>
      </a>
      <span className="uebersicht-status">
        {status.wuenschenswertOffen && (
          <span className="uebersicht-w" title="wünschenswert nicht erreicht – blockiert nicht" aria-label="wünschenswert nicht erreicht">
            W
          </span>
        )}
        <AmpelMarke ampel={status.ampel} text={status.text} />
      </span>
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
