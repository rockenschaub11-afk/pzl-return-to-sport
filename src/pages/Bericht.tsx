import { usePatient, useTestung, useTestungenVon } from '../daten'
import { useEffect, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { type Testung } from '../db'
import Laedt from '../Laedt'
import { datumDeutsch, type Patient } from '../patienten/stammdaten'
import { useMeloqAuswahl } from '../testung/meloqAuswahl'
import { nachBloecken, verfuegbareOptionen } from '../testung/verlauf'
import ArztAnsicht from '../berichte/ArztAnsicht'
import PatAnsicht from '../berichte/PatAnsicht'
import { bisZu, NameKontext, waehleOption } from '../berichte/teile'

/** Druckansicht für Arztbericht und Pat./Trainer-Bericht (Etappe 9). „Als PDF speichern“ im Druckdialog des Browsers. */
export default function Bericht() {
  const { id, art } = useParams()
  const arzt = art !== 'pat'
  const testung = useTestung(id)
  const patient = usePatient(testung?.patientId)
  const alle = useTestungenVon(testung?.patientId)
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
            <h1 className="seitentitel">Bericht {patient.kuerzel}</h1>
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
        <NameKontext.Provider value={name}>
          <ArztAnsicht patient={patient} testung={testung} alle={alle} verlaufWahl={verlaufWahl} meloqAuswahl={meloqAuswahl} />
        </NameKontext.Provider>
      ) : (
        <NameKontext.Provider value={name}>
          <PatAnsicht patient={patient} testung={testung} alle={alle} />
        </NameKontext.Provider>
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

function VerlaufWahl({ patient, testungen, wahl, setWahl }: { patient: Patient; testungen: Testung[]; wahl: string; setWahl: (w: string) => void }) {
  const optionen = verfuegbareOptionen(patient, testungen)
  if (optionen.length === 0) return null
  return (
    <label className="feld">
      <span className="feld-label">Diagramm im Verlauf</span>
      <select value={waehleOption(optionen, wahl).id} onChange={(e) => setWahl(e.target.value)}>
        {nachBloecken(optionen).map((g) => (
          <optgroup key={g.name} label={g.name}>
            {g.optionen.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}
