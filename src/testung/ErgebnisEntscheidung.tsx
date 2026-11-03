import { useState } from 'react'
import Frage from '../Frage'
import type { Entscheidung, FruehererAbschluss, Testung } from '../db'
import { HINWEIS } from '../navigation'
import { datumDeutsch } from '../patienten/stammdaten'
import { RTS_TEXT, type RtsVorschlag } from './rts'

export const ENTSCHEIDUNG_TEXT: Record<Exclude<Entscheidung['art'], ''>, string> = {
  bestaetigt: 'Vorschlag bestätigt',
  ueberstimmt_erfuellt: 'Überstimmt: Kriterien als erfüllt beurteilt',
  ueberstimmt_nicht_erfuellt: 'Überstimmt: Kriterien als nicht erfüllt beurteilt',
}

/** Endergebnis nach der Entscheidung der Therapeut:in. */
export function endErgebnis(e: Entscheidung | undefined, vorschlagErfuellt: boolean): 'erfuellt' | 'nicht_erfuellt' | null {
  if (!e?.art) return null
  if (e.art === 'bestaetigt') return vorschlagErfuellt ? 'erfuellt' : 'nicht_erfuellt'
  return e.art === 'ueberstimmt_erfuellt' ? 'erfuellt' : 'nicht_erfuellt'
}

/** Ein früherer Abschluss als Satz, z. B. „Kriterien erfüllt – Vorschlag bestätigt · Therapeut:in PR“ (auch im Arztbericht). */
export function fruehererAbschlussText(f: FruehererAbschluss): { zeit: string; ergebnis: string; begruendung: string } {
  const e = f.entscheidung
  const ende = f.art === 'endtestung' ? endErgebnis(e, e?.vorschlagBeiAbschluss === 'erfuellt') : null
  const teile = [ende ? RTS_TEXT[ende] : f.art === 'verlauf' ? 'Verlaufstest abgeschlossen' : 'ohne Entscheidung', e?.art ? ENTSCHEIDUNG_TEXT[e.art] : ''].filter(Boolean)
  const datum = (iso: string) => (iso ? datumDeutsch(iso.slice(0, 10)) : '–')
  return {
    zeit: `abgeschlossen am ${datum(f.abgeschlossenAm)}, wieder geöffnet am ${datum(f.wiedergeoeffnetAm)}`,
    ergebnis: `${teile.join(' – ')}${e?.therapeut ? ` · Therapeut:in ${e.therapeut}` : ''}`,
    begruendung: e?.begruendung?.trim() ?? '',
  }
}

/** Liste der früheren Abschlüsse unter Ergebnis bzw. Abschluss (Audit W2). */
export function FruehereAbschluesse({ testung }: { testung: Testung }) {
  const liste = testung.fruehereAbschluesse ?? []
  if (liste.length === 0) return null
  return (
    <details className="test-mehr fruehere-abschluesse">
      <summary>Frühere Abschlüsse ({liste.length})</summary>
      <ul>
        {liste.map((f, i) => {
          const t = fruehererAbschlussText(f)
          return (
            <li key={i}>
              <span className="hinweis-leise">{t.zeit}</span>
              <strong>{t.ergebnis}</strong>
              {t.begruendung && <span>Begründung: {t.begruendung}</span>}
            </li>
          )
        })}
      </ul>
    </details>
  )
}

/** Was vor dem Abschluss noch fehlt (leer = abschließbar). */
export function abschlussFehler(e: Entscheidung | undefined): string[] {
  const f: string[] = []
  if (!e?.art) f.push('Bitte eine Entscheidung wählen.')
  if (e?.art?.startsWith('ueberstimmt') && !e.begruendung.trim()) f.push('Beim Überstimmen ist eine Begründung Pflicht.')
  if (!e?.therapeut.trim()) f.push('Bitte das Kürzel der Therapeut:in eintragen.')
  return f
}

interface Props {
  testung: Testung
  vorschlag: RtsVorschlag
  setzeEntscheidung: (e: Entscheidung) => void
  abschliessen: () => void
  wiederOeffnen: () => void
}

export default function ErgebnisEntscheidung({ testung, vorschlag: v, setzeEntscheidung, abschliessen, wiederOeffnen }: Props) {
  const [versucht, setVersucht] = useState(false)
  const [oeffnenFragen, setOeffnenFragen] = useState(false)
  const abgeschlossen = testung.status === 'abgeschlossen'
  const e: Entscheidung = testung.entscheidung ?? { art: '', begruendung: '', therapeut: '' }
  const setze = (teil: Partial<Entscheidung>) => setzeEntscheidung({ ...e, ...teil })
  const vorschlagErfuellt = abgeschlossen && e.vorschlagBeiAbschluss ? e.vorschlagBeiAbschluss === 'erfuellt' : v.erfuellt
  const ende = endErgebnis(e, vorschlagErfuellt)
  const fehler = abschlussFehler(e)

  return (
    <section id="ergebnis" className="karte ergebnis">
      <h2 className="testung-block-titel">Ergebnis & Entscheidung</h2>

      <div className={`ergebnis-vorschlag ${vorschlagErfuellt ? 'rts-erfuellt' : 'rts-offen'}`}>
        <span className="rts-titel">Vorschlag der App</span>
        <strong>{vorschlagErfuellt ? RTS_TEXT.erfuellt : RTS_TEXT.nicht_erfuellt}</strong>
        <span className="rts-hinweis">{HINWEIS}</span>
      </div>

      {v.aclRsiWarnung && <p className="meldung meldung-warnung ergebnis-acl">⚠ {v.aclRsiWarnung} – blockiert den Vorschlag nicht.</p>}

      {v.wasFehlt.length > 0 && (
        <>
          <h3>Was fehlt noch?</h3>
          <ul className="ergebnis-liste">
            {v.wasFehlt.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </>
      )}

      {v.wuenschenswertNichtErreicht.length > 0 && (
        <>
          <h3>Wünschenswert, nicht erreicht (blockiert nicht)</h3>
          <ul className="ergebnis-liste ergebnis-leise">
            {v.wuenschenswertNichtErreicht.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </>
      )}

      {v.hinweise.map((h) => (
        <p key={h} className="meldung meldung-info">
          {h}
        </p>
      ))}

      <h3>Entscheidung der Therapeut:in</h3>
      {abgeschlossen ? (
        <div className="entscheidung-fertig">
          <p>
            <strong>{ende === 'erfuellt' ? RTS_TEXT.erfuellt : RTS_TEXT.nicht_erfuellt}</strong>
            {e.art && ` – ${ENTSCHEIDUNG_TEXT[e.art]}`}
          </p>
          {e.begruendung && <p>Begründung: {e.begruendung}</p>}
          <p className="hinweis-leise">
            Therapeut:in {e.therapeut} · abgeschlossen am {testung.abgeschlossenAm ? datumDeutsch(testung.abgeschlossenAm.slice(0, 10)) : '–'}
          </p>
          {!oeffnenFragen ? (
            <button type="button" className="knopf" onClick={() => setOeffnenFragen(true)}>
              <span>Wieder öffnen …</span>
            </button>
          ) : (
            <Frage className="meldung meldung-warnung" label="Wieder öffnen bestätigen" onAbbrechen={() => setOeffnenFragen(false)}>
              <p>Testung wieder bearbeitbar machen? Die Entscheidung muss danach neu getroffen werden – der bisherige Abschluss bleibt unter „Frühere Abschlüsse“ dokumentiert.</p>
              <div className="aktionen">
                <button
                  type="button"
                  className="knopf knopf-haupt"
                  onClick={() => {
                    // frischer Start: alte Hinweise aus dem letzten Abschlussversuch nicht gleich wieder zeigen
                    setVersucht(false)
                    setOeffnenFragen(false)
                    wiederOeffnen()
                  }}
                >
                  <span>Ja, wieder öffnen</span>
                </button>
                <button type="button" className="knopf" data-abbrechen onClick={() => setOeffnenFragen(false)}>
                  <span>Abbrechen</span>
                </button>
              </div>
            </Frage>
          )}
        </div>
      ) : (
        <>
          <div className="entscheidung-wahl" role="radiogroup" aria-label="Entscheidung">
            {(Object.keys(ENTSCHEIDUNG_TEXT) as (keyof typeof ENTSCHEIDUNG_TEXT)[]).map((art) => (
              <label key={art} className={`entscheidung-option${e.art === art ? ' gewaehlt' : ''}`}>
                <input type="radio" name="entscheidung" checked={e.art === art} onChange={() => setze({ art })} />
                <span>{ENTSCHEIDUNG_TEXT[art]}</span>
              </label>
            ))}
          </div>
          <label className="feld">
            <span className="feld-label">
              Begründung {e.art.startsWith('ueberstimmt') ? <span className="block-marke">Pflicht</span> : '(optional)'}
            </span>
            <textarea rows={3} value={e.begruendung} onChange={(x) => setze({ begruendung: x.target.value })} />
          </label>
          <label className="feld">
            <span className="feld-label">
              Therapeut:in (Kürzel) <span className="block-marke">Pflicht</span>
            </span>
            <input value={e.therapeut} onChange={(x) => setze({ therapeut: x.target.value })} placeholder="z. B. PR" maxLength={12} />
          </label>
          {versucht && fehler.length > 0 && (
            <ul className="meldung meldung-fehler" role="alert">
              {fehler.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
          <div className="aktionen">
            <button
              type="button"
              className="knopf knopf-haupt"
              onClick={() => {
                setVersucht(true)
                if (fehler.length === 0) abschliessen()
              }}
            >
              <span>Testung abschließen</span>
            </button>
            <span className="hinweis-leise">Danach ist die Testung schreibgeschützt.</span>
          </div>
        </>
      )}
      <FruehereAbschluesse testung={testung} />
    </section>
  )
}

/** Abschluss eines Verlaufstests: ohne RTS-Vorschlag, nur Therapeut:in und Sperre (Etappe 7). */
export function AbschlussVerlauf({ testung, setzeEntscheidung, abschliessen, wiederOeffnen }: Omit<Props, 'vorschlag'>) {
  const [versucht, setVersucht] = useState(false)
  const [oeffnenFragen, setOeffnenFragen] = useState(false)
  const e: Entscheidung = testung.entscheidung ?? { art: '', begruendung: '', therapeut: '' }
  const fehlt = !e.therapeut.trim()
  return (
    <section id="ergebnis" className="karte ergebnis">
      <h2 className="testung-block-titel">Abschluss</h2>
      <p className="hinweis-leise">Verlaufstest – ohne RTS-Vorschlag. Die Ampel je Test gilt mit den Schwellen der Phase.</p>
      {testung.status === 'abgeschlossen' ? (
        <div className="entscheidung-fertig">
          <p className="hinweis-leise">
            Therapeut:in {e.therapeut} · abgeschlossen am {testung.abgeschlossenAm ? datumDeutsch(testung.abgeschlossenAm.slice(0, 10)) : '–'}
          </p>
          {!oeffnenFragen ? (
            <button type="button" className="knopf" onClick={() => setOeffnenFragen(true)}>
              <span>Wieder öffnen …</span>
            </button>
          ) : (
            <Frage className="meldung meldung-warnung" label="Wieder öffnen bestätigen" onAbbrechen={() => setOeffnenFragen(false)}>
              <p>Verlaufstest wieder bearbeitbar machen? Der bisherige Abschluss bleibt unter „Frühere Abschlüsse“ dokumentiert.</p>
              <div className="aktionen">
                <button
                  type="button"
                  className="knopf knopf-haupt"
                  onClick={() => {
                    // frischer Start: alte Hinweise aus dem letzten Abschlussversuch nicht gleich wieder zeigen
                    setVersucht(false)
                    setOeffnenFragen(false)
                    wiederOeffnen()
                  }}
                >
                  <span>Ja, wieder öffnen</span>
                </button>
                <button type="button" className="knopf" data-abbrechen onClick={() => setOeffnenFragen(false)}>
                  <span>Abbrechen</span>
                </button>
              </div>
            </Frage>
          )}
        </div>
      ) : (
        <>
          <label className={`feld${versucht && fehlt ? ' feld-fehler' : ''}`}>
            <span className="feld-label">
              Therapeut:in (Kürzel) <span className="block-marke">Pflicht</span>
            </span>
            <input value={e.therapeut} onChange={(x) => setzeEntscheidung({ ...e, therapeut: x.target.value })} placeholder="z. B. PR" maxLength={12} />
            {versucht && fehlt && <span className="feld-meldung">Bitte das Kürzel der Therapeut:in eintragen.</span>}
          </label>
          <div className="aktionen">
            <button
              type="button"
              className="knopf knopf-haupt"
              onClick={() => {
                setVersucht(true)
                if (!fehlt) abschliessen()
              }}
            >
              <span>Testung abschließen</span>
            </button>
            <span className="hinweis-leise">Danach ist die Testung schreibgeschützt.</span>
          </div>
        </>
      )}
      <FruehereAbschluesse testung={testung} />
    </section>
  )
}
