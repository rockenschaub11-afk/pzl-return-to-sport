import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, KuerzelVergebenFehler, loeschePatient, speicherePatient } from '../db'
import {
  BEGLEIT_OP_HILFE,
  BEGLEIT_OPS,
  freiesKuerzel,
  GESCHLECHTER,
  GRAFTS,
  isoDatum,
  kuerzelVorschlag,
  LEER,
  NIVEAUS,
  normalisiereKuerzel,
  pruefe,
  SEITEN,
  TEGNER_STUFEN,
  type BegleitOp,
  type Stammdaten,
} from '../patienten/stammdaten'
import PatientTestungen from '../testung/PatientTestungen'
import VerlaufBereich from '../testung/VerlaufBereich'

export default function PatientFormular() {
  const { id } = useParams()
  const neu = id === undefined
  const navigate = useNavigate()

  const gespeichert = useLiveQuery(() => (id ? db.patienten.get(id) : undefined), [id])
  const alle = useLiveQuery(() => db.patienten.toArray(), [])

  const [daten, setDaten] = useState<Stammdaten>(LEER)
  const [geladen, setGeladen] = useState(neu)
  const [versucht, setVersucht] = useState(false)
  const [loeschenFragen, setLoeschenFragen] = useState(false)
  const [speicherFehler, setSpeicherFehler] = useState('')

  useEffect(() => {
    if (gespeichert && !geladen) {
      const { id: _id, kuerzelNorm: _k, angelegtAm: _a, geaendertAm: _g, ...stamm } = gespeichert
      setDaten({ ...LEER, ...stamm })
      setGeladen(true)
    }
  }, [gespeichert, geladen])

  if (!neu && gespeichert === undefined && alle !== undefined && !geladen) {
    return (
      <div className="karte">
        <p>Dieses Kürzel gibt es nicht (mehr).</p>
        <Link to="/patienten" className="knopf">
          <span>Zur Pat.-Liste</span>
        </Link>
      </div>
    )
  }
  if (!geladen || !alle) return null

  const setze = <K extends keyof Stammdaten>(feld: K, wert: Stammdaten[K]) =>
    setDaten((d) => ({ ...d, [feld]: wert }))

  const andere = alle.filter((p) => p.id !== id)
  const dublette = andere.find((p) => p.kuerzelNorm === normalisiereKuerzel(daten.kuerzel))
  const fehler = pruefe(daten)
  if (dublette) fehler.kuerzel = `Das Kürzel ${dublette.kuerzel} gibt es schon.`
  const zeigeFehler = (feld: keyof Stammdaten) => (versucht ? fehler[feld] : undefined)
  const vorschlag = kuerzelVorschlag(daten.kuerzel, daten.geburtsjahr)
  const ausweich = dublette ? freiesKuerzel(daten.kuerzel, andere.map((p) => p.kuerzelNorm)) : null

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setVersucht(true)
    setSpeicherFehler('')
    if (Object.keys(fehler).length > 0) return
    try {
      await speicherePatient(daten, id)
      navigate('/patienten')
    } catch (err) {
      setSpeicherFehler(err instanceof KuerzelVergebenFehler ? err.message : 'Speichern hat nicht geklappt. Bitte nochmals versuchen.')
    }
  }

  async function loeschen() {
    if (!id) return
    await loeschePatient(id)
    navigate('/patienten')
  }

  function begleitOpUmschalten(op: BegleitOp) {
    setze('begleitOps', daten.begleitOps.includes(op) ? daten.begleitOps.filter((o) => o !== op) : [...daten.begleitOps, op])
  }

  return (
    <form onSubmit={speichern} noValidate>
      <div className="seitenkopf">
        <div>
          <p className="seitenzusatz">
            <Link to="/patienten">← Pat.-Liste</Link>
          </p>
          <h2 className="seitentitel">{neu ? 'Neues Kürzel' : normalisiereKuerzel(daten.kuerzel) || 'Kürzel'}</h2>
        </div>
      </div>

      {id && <PatientTestungen patientId={id} />}
      {id && gespeichert && <VerlaufBereich patient={gespeichert} />}

      <fieldset className="karte block">
        <legend className="block-titel">
          Pflichtangaben <span className="block-marke">Pflicht</span>
        </legend>

        <Feld label="Kürzel" fehler={zeigeFehler('kuerzel')} hilfe="Initialen + Geburtsjahr, z. B. MH-1998. Keine Namen – der Name wird nur beim PDF-Bericht eingetippt.">
          <input
            className="eingabe-kuerzel"
            value={daten.kuerzel}
            onChange={(e) => setze('kuerzel', e.target.value.toUpperCase())}
            placeholder="MH-1998"
            autoComplete="off"
            spellCheck={false}
            maxLength={20}
            aria-invalid={!!zeigeFehler('kuerzel')}
          />
        </Feld>
        {dublette && (
          <div className="meldung meldung-warnung" role="alert">
            <strong>{dublette.kuerzel}</strong> ist schon angelegt.{' '}
            <Link to={`/patienten/${dublette.id}`}>Vorhandenes öffnen</Link>
            {ausweich && (
              <>
                {' '}oder{' '}
                <button type="button" className="text-knopf" onClick={() => setze('kuerzel', ausweich)}>
                  {ausweich} verwenden
                </button>
              </>
            )}
          </div>
        )}
        {vorschlag && !dublette && (
          <p className="meldung meldung-info">
            Vorschlag:{' '}
            <button type="button" className="text-knopf" onClick={() => setze('kuerzel', vorschlag)}>
              {vorschlag} übernehmen
            </button>
          </p>
        )}

        <div className="feld-reihe">
          <Feld gruppe label="Betroffene Seite" fehler={zeigeFehler('seite')}>
            <Auswahl werte={SEITEN} wert={daten.seite} onChange={(v) => setze('seite', v)} />
          </Feld>
          <Feld gruppe label="Niveau" fehler={zeigeFehler('niveau')} hilfe="Bei Freizeit-Niveau weist die App später auf die 12-Monats-Empfehlung (Read) hin.">
            <Auswahl werte={NIVEAUS} wert={daten.niveau} onChange={(v) => setze('niveau', v)} />
          </Feld>
        </div>

        <div className="feld-reihe">
          <Feld label={daten.konservativ ? 'Verletzungsdatum' : 'OP-Datum'} fehler={zeigeFehler('opDatum')}>
            <input
              type="date"
              value={daten.opDatum}
              max={isoDatum(new Date())}
              onChange={(e) => setze('opDatum', e.target.value)}
              aria-invalid={!!zeigeFehler('opDatum')}
            />
          </Feld>
          <div className="feld feld-haken">
            <Haken label="konservativ behandelt (keine OP)" wert={daten.konservativ} onChange={(v) => setze('konservativ', v)} />
            <Haken label="Revisions-OP" wert={daten.revision} onChange={(v) => setze('revision', v)} />
          </div>
        </div>
      </fieldset>

      <fieldset className="karte block">
        <legend className="block-titel">
          Weitere Angaben <span className="block-marke block-marke-leise">optional</span>
        </legend>
        <p className="hinweis-leise">Für Normdaten, Frauen-Regel und Interpretation. Leer lassen ist in Ordnung.</p>

        <div className="feld-reihe">
          <Feld gruppe label="Geschlecht">
            <Auswahl werte={GESCHLECHTER} wert={daten.geschlecht} onChange={(v) => setze('geschlecht', v)} abwaehlbar />
          </Feld>
          <Feld label="Geburtsjahr" fehler={zeigeFehler('geburtsjahr')}>
            <input
              inputMode="numeric"
              value={daten.geburtsjahr}
              onChange={(e) => setze('geburtsjahr', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1998"
              aria-invalid={!!zeigeFehler('geburtsjahr')}
            />
          </Feld>
          <Feld label="Beinlänge (cm)" fehler={zeigeFehler('beinlaengeCm')} hilfe="Für Hops in % der Beinlänge.">
            <input
              inputMode="decimal"
              value={daten.beinlaengeCm}
              onChange={(e) => setze('beinlaengeCm', e.target.value)}
              placeholder="92"
              aria-invalid={!!zeigeFehler('beinlaengeCm')}
            />
          </Feld>
        </div>

        {!daten.konservativ && (
          <>
            <Feld gruppe label="Graft">
              <Auswahl werte={GRAFTS} wert={daten.graft} onChange={(v) => setze('graft', v)} abwaehlbar />
            </Feld>
            <Feld gruppe label="Begleit-OP" hilfe={`LET = ${BEGLEIT_OP_HILFE.let}`}>
              <div className="auswahl">
                {(Object.keys(BEGLEIT_OPS) as BegleitOp[]).map((op) => (
                  <button
                    key={op}
                    type="button"
                    className="auswahl-knopf"
                    aria-pressed={daten.begleitOps.includes(op)}
                    onClick={() => begleitOpUmschalten(op)}
                    title={BEGLEIT_OP_HILFE[op]}
                  >
                    {BEGLEIT_OPS[op]}
                  </button>
                ))}
              </div>
            </Feld>
            <Feld label="Begleit-OP sonstiges">
              <input
                value={daten.begleitOpAndere}
                onChange={(e) => setze('begleitOpAndere', e.target.value)}
                placeholder="z. B. Meniskusnaht medial"
                maxLength={80}
              />
            </Feld>
          </>
        )}

        <div className="feld-reihe">
          <Feld label="Sportart">
            <input value={daten.sportart} onChange={(e) => setze('sportart', e.target.value)} placeholder="z. B. Fußball" maxLength={40} />
          </Feld>
        </div>
        <Feld
          label="Tegner vor Verletzung"
          fehler={zeigeFehler('tegner')}
          hilfe="Aktivitätsniveau vor dem Kreuzbandriss (Tegner-Skala 0–10)."
        >
          <select className="auswahl-liste" value={daten.tegner} onChange={(e) => setze('tegner', e.target.value)}>
            <option value="">– keine Angabe –</option>
            {TEGNER_STUFEN.map((text, stufe) => (
              <option key={stufe} value={String(stufe)}>
                {stufe} – {text}
              </option>
            ))}
          </select>
        </Feld>
      </fieldset>

      {versucht && Object.keys(fehler).length > 0 && (
        <p className="meldung meldung-fehler" role="alert">
          Bitte die rot markierten Felder prüfen.
        </p>
      )}
      {speicherFehler && (
        <p className="meldung meldung-fehler" role="alert">
          {speicherFehler}
        </p>
      )}

      <div className="aktionen">
        <button type="submit" className="knopf knopf-haupt">
          <span>Speichern</span>
        </button>
        <Link to="/patienten" className="knopf">
          <span>Abbrechen</span>
        </Link>
        {!neu && !loeschenFragen && (
          <button type="button" className="knopf knopf-gefahr aktionen-rechts" onClick={() => setLoeschenFragen(true)}>
            <span>Löschen …</span>
          </button>
        )}
      </div>

      {loeschenFragen && (
        <div className="meldung meldung-fehler loeschen-frage" role="alertdialog" aria-label="Löschen bestätigen">
          <p>
            <strong>{gespeichert?.kuerzel}</strong> samt allen Testungen endgültig von diesem Laptop löschen?
          </p>
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
    </form>
  )
}

// Knopf-Gruppen dürfen nicht in einem <label> stecken (ein Klick auf die Beschriftung würde den ersten Knopf drücken)
function Feld({
  label,
  fehler,
  hilfe,
  gruppe = false,
  children,
}: {
  label: string
  fehler?: string
  hilfe?: string
  gruppe?: boolean
  children: ReactNode
}) {
  const Huelle = gruppe ? 'div' : 'label'
  return (
    <Huelle
      className={`feld${fehler ? ' feld-fehler' : ''}`}
      role={gruppe ? 'group' : undefined}
      aria-label={gruppe ? label : undefined}
    >
      <span className="feld-label">{label}</span>
      {children}
      {fehler ? <span className="feld-meldung">{fehler}</span> : hilfe && <span className="feld-hilfe">{hilfe}</span>}
    </Huelle>
  )
}

function Auswahl<T extends string>({
  werte,
  wert,
  onChange,
  abwaehlbar = false,
}: {
  werte: Record<T, string>
  wert: T | ''
  onChange: (v: T | '') => void
  abwaehlbar?: boolean
}) {
  return (
    <span className="auswahl">
      {(Object.keys(werte) as T[]).map((k) => (
        <button
          key={k}
          type="button"
          className="auswahl-knopf"
          aria-pressed={wert === k}
          onClick={() => onChange(abwaehlbar && wert === k ? '' : k)}
        >
          {werte[k]}
        </button>
      ))}
    </span>
  )
}

function Haken({ label, wert, onChange }: { label: string; wert: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="haken">
      <input type="checkbox" checked={wert} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}
