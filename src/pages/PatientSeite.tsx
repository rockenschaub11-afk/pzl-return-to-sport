import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { arztBericht, patBericht } from '../berichte/bericht'
import LsiUebersicht from '../berichte/LsiUebersicht'
import OdsVergleich, { OdsHinweis } from '../berichte/OdsVergleich'
import { odsFuerTestung } from '../berichte/odsZeilen'
import { lsiUebersicht } from '../berichte/lsiZeilen'
import { db, type Testung } from '../db'
import Laedt from '../Laedt'
import { phaseNach } from '../katalog'
import { letzterStand, nachDatum, pflichtKurz } from '../patienten/uebersicht'
import { BEGLEIT_OPS, datumDeutsch, GRAFTS, monateSeit, NIVEAUS, type Patient } from '../patienten/stammdaten'
import { phaseAusMonaten } from '../testung/ablauf'
import { einheitFest } from '../testung/erfassung'
import { AmpelMarke } from '../testung/Ladebalken'
import PatientTestungen, { useNeueTestung } from '../testung/PatientTestungen'
import VerlaufBereich from '../testung/VerlaufBereich'
import PatientFormular from './PatientFormular'

const REITER = [
  ['uebersicht', 'Übersicht'],
  ['testungen', 'Testungen'],
  ['stammdaten', 'Stammdaten'],
] as const
type ReiterId = (typeof REITER)[number][0]

/** Seite eines Kürzels als Dashboard mit Reitern (DESIGNKONZEPT 7). Alle Reiter bleiben geladen, damit Eingaben im Formular beim Wechseln erhalten bleiben. */
export default function PatientSeite() {
  const { id = '' } = useParams()
  const patient = useLiveQuery(async () => (await db.patienten.get(id)) ?? null, [id])
  const testungen = useLiveQuery(() => db.testungen.where('patientId').equals(id).toArray(), [id])
  // Reiter steht in der Adresse: „Zurück“ aus einer Testung landet wieder am selben Ort
  const [adresse, setAdresse] = useSearchParams()
  const reiter: ReiterId = REITER.find(([r]) => r === adresse.get('reiter'))?.[0] ?? 'uebersicht'
  const setReiter = (r: ReiterId) =>
    setAdresse(
      (a) => {
        if (r === 'uebersicht') a.delete('reiter')
        else a.set('reiter', r)
        return a
      },
      { replace: true },
    )
  const reiterTaste = (e: React.KeyboardEvent, i: number) => {
    const ziel = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: REITER.length - 1 }[e.key]
    if (ziel === undefined) return
    e.preventDefault()
    const [r] = REITER[(ziel + REITER.length) % REITER.length]
    setReiter(r)
    document.getElementById(`reiter-${r}`)?.focus()
  }
  const starten = useNeueTestung(id)

  if (patient === undefined) return <Laedt />
  if (patient === null) {
    return (
      <div className="karte">
        <p>Dieses Kürzel gibt es nicht (mehr).</p>
        <Link to="/patienten" className="knopf">
          <span>Zur Pat.-Liste</span>
        </Link>
      </div>
    )
  }

  const monate = monateSeit(patient.opDatum)
  const phaseHeute = monate === null ? null : phaseNach(phaseAusMonaten(monate))

  return (
    <section>
      <div className="seitenkopf seitenkopf-fest">
        <div>
          <p className="seitenzusatz">
            <Link to="/patienten">← Pat.-Liste</Link>
          </p>
          <div className="seitenkopf-zeile">
            <h1 className="seitentitel" translate="no">{patient.kuerzel}</h1>
            <span className="chip">betroffen: {patient.seite === 'links' ? 'links' : 'rechts'}</span>
            {phaseHeute && <span className="chip">heute: {phaseHeute.name}</span>}
          </div>
        </div>
        <div className="aktionen">
          <Link to={`/sicherung?kuerzel=${patient.id}`} className="knopf">
            <span>Übergeben</span>
          </Link>
          <button type="button" className="knopf knopf-haupt" onClick={starten}>
            <span>Neue Testung</span>
          </button>
        </div>
      </div>

      <div className="reiter" role="tablist" aria-label="Bereiche des Kürzels">
        {REITER.map(([rid, name], i) => (
          <button
            key={rid}
            type="button"
            role="tab"
            id={`reiter-${rid}`}
            aria-selected={reiter === rid}
            aria-controls={`bereich-${rid}`}
            tabIndex={reiter === rid ? 0 : -1}
            onClick={() => setReiter(rid)}
            onKeyDown={(e) => reiterTaste(e, i)}
          >
            {name}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="bereich-uebersicht" aria-labelledby="reiter-uebersicht" hidden={reiter !== 'uebersicht'}>
        {testungen && <Uebersicht patient={patient} testungen={testungen} zuTestungen={() => setReiter('testungen')} />}
      </div>
      <div role="tabpanel" id="bereich-testungen" aria-labelledby="reiter-testungen" hidden={reiter !== 'testungen'}>
        <PatientTestungen patientId={patient.id} mitKnopf={false} />
      </div>
      <div role="tabpanel" id="bereich-stammdaten" aria-labelledby="reiter-stammdaten" hidden={reiter !== 'stammdaten'}>
        <PatientFormular eingebettet />
      </div>
    </section>
  )
}

function Uebersicht({ patient, testungen, zuTestungen }: { patient: Patient; testungen: Testung[]; zuTestungen: () => void }) {
  const stand = letzterStand(patient, testungen)
  const pflicht = pflichtKurz(patient, testungen)
  const letzte = nachDatum(testungen)[0]
  // Alle Seitenvergleiche der letzten Testung statt einzelner Kennzahlen (UI-Audit Punkt 6) – Werte wie im Arztbericht
  const lsi = useMemo(() => (letzte ? lsiUebersicht(arztBericht(patient, letzte), patBericht(patient, letzte, testungen)) : []), [patient, letzte, testungen])
  const vorigeDatum = useMemo(() => (letzte ? patBericht(patient, letzte, testungen).vorigeDatum : null), [patient, letzte, testungen])
  const ods = useMemo(() => (letzte ? odsFuerTestung(patient, letzte) : []), [patient, letzte])

  return (
    <>
      {stand ? (
        <section className="karte karte-laut status-letzte" aria-label="Stand der letzten Testung">
          <div className="status-aussage">
            <span className="status-herkunft">{stand.herkunft}</span>
            <h2 className="status-titel">{stand.aussage}</h2>
            <span className="status-herkunft">
              {stand.titel} · <span className={`status${stand.abgeschlossen ? '' : ' status-arbeit'}`}>{stand.abgeschlossen ? 'abgeschlossen' : 'in Arbeit'}</span>
            </span>
            <dl className="status-zahlen">
              {pflicht && (
                <div>
                  <dt>Pflicht erfüllt</dt>
                  <dd>
                    {pflicht.erfuellt}
                    <span> / {pflicht.gesamt}</span>
                  </dd>
                </div>
              )}
              <div>
                <dt>Tests erfasst</dt>
                <dd>
                  {stand.fortschritt.erfasst}
                  <span> / {stand.fortschritt.gesamt}</span>
                </dd>
              </div>
            </dl>
            {stand.endtestung && <span className="status-herkunft">Ersetzt keine ärztliche Freigabe.</span>}
            {stand.warnung && <p className="status-warnung">⚠ {stand.warnung} – blockiert nicht.</p>}
          </div>
          <div>
            <h2 className="block-titel">{stand.endtestung ? 'Was fehlt noch?' : 'Noch nicht erfüllt oder offen'}</h2>
            {stand.offen.length > 0 ? (
              <ul className="status-offen">
                {stand.offen.map((o) => (
                  <li key={o.text}>
                    <AmpelMarke ampel={o.ampel} />
                    <span>{einheitFest(o.text)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hinweis-leise">Alle Pflicht-Kriterien dieser Testung sind erfüllt.</p>
            )}
            <div className="aktionen">
              <Link to={`/testung/${stand.testung.id}`} className="knopf">
                <span>Zur Testung</span>
              </Link>
              <Link to={`/berichte/${stand.testung.id}/arzt`} className="knopf">
                <span>Bericht</span>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="karte leer-handlung">
          <p>Noch keine Testung für dieses Kürzel.</p>
          <p className="hinweis-leise">Oben rechts mit „Neue Testung“ beginnen – die Phase ergibt sich aus dem OP-Datum.</p>
        </section>
      )}

      <div className="dashboard-raster">
        <Kopfkarte patient={patient} letzte={letzte} anzahl={testungen.length} zuTestungen={zuTestungen} />
        <section className="karte block seitenvergleich" aria-label="Seitenvergleich">
          <h2 className="block-titel">Seitenvergleich der letzten Testung</h2>
          {lsi.length > 0 ? <LsiUebersicht zeilen={lsi} vorigeDatum={vorigeDatum} zeile={21} bewegt /> : <p className="hinweis-leise">Sobald Tests mit Seitenvergleich erfasst sind, erscheint hier der LSI je Test.</p>}
        </section>
      </div>
      {ods.length > 0 && (
        <section className="karte block seitenvergleich" aria-label="Sprünge nach Output, Driver und Strategy">
          <h2 className="block-titel">Sprünge: Ergebnis, Antrieb, Strategie</h2>
          {ods.map((v) => (
            <div key={v.test} className="ods-block">
              <h3 className="ods-titel">{v.name}</h3>
              <OdsVergleich vergleich={v} zeile={21} />
            </div>
          ))}
          <OdsHinweis />
        </section>
      )}
      <VerlaufBereich patient={patient} />
    </>
  )
}

function Kopfkarte({ patient: p, letzte, anzahl, zuTestungen }: { patient: Patient; letzte?: { datum: string; tegnerAktuell: string; koerpergewichtKg: string }; anzahl: number; zuTestungen: () => void }) {
  const monate = monateSeit(p.opDatum)
  const begleit = [...p.begleitOps.map((b) => BEGLEIT_OPS[b]), p.begleitOpAndere].filter(Boolean).join(', ')
  const fakten: [string, string][] = [
    [p.konservativ ? 'Seit Verletzung' : 'Seit OP', monate === null ? '–' : `${monate} Monate`],
    ['Niveau', p.niveau ? NIVEAUS[p.niveau] : '–'],
  ]
  if (p.graft) fakten.push(['Graft', GRAFTS[p.graft].replace(/ \(.*\)$/, '')])
  if (begleit) fakten.push(['Begleit-OP', begleit])
  if (p.tegner !== '' || letzte?.tegnerAktuell) fakten.push(['Tegner', `${p.tegner || '–'} → aktuell ${letzte?.tegnerAktuell || '–'}`])
  if (letzte?.koerpergewichtKg) fakten.push(['Gewicht', `${letzte.koerpergewichtKg} kg`])
  if (letzte) fakten.push(['Letzte Testung', datumDeutsch(letzte.datum)])

  return (
    <section className="karte kopfkarte" aria-label="Kopfdaten">
      <div className="kopfkarte-zeile">
        <BeinSymbol links={p.seite === 'links'} />
        <div>
          <p className="kopfkarte-seite">Betroffen: {p.seite === 'links' ? 'links' : 'rechts'}</p>
          <p className="hinweis-leise">{[p.sportart, p.revision && 'Revision', p.konservativ && 'konservativ'].filter(Boolean).join(', ') || '–'}</p>
        </div>
      </div>
      <dl className="kopfkarte-fakten">
        {fakten.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {anzahl > 0 && (
        <button type="button" className="kopfkarte-link" onClick={zuTestungen}>
          Alle {anzahl} Testungen ansehen
        </button>
      )}
    </section>
  )
}

/** Beine von vorne – das linke Bein der Pat. ist rechts im Bild. Nur Angabe aus den Stammdaten. */
function BeinSymbol({ links }: { links: boolean }) {
  const knieX = links ? 30.5 : 15.5
  return (
    <svg className="bein-symbol" viewBox="0 0 46 64" role="img" aria-label={`Betroffen: ${links ? 'linkes' : 'rechtes'} Knie`}>
      <path d="M8 2 C7 14 9 24 11 31 C10 35 10 38 11 41 C8 50 10 56 12 61 L19 61 C20 55 21 48 20 41 C21 37 21 34 20 31 C22 24 22 14 21 2 Z" />
      <path d="M38 2 C39 14 37 24 35 31 C36 35 36 38 35 41 C38 50 36 56 34 61 L27 61 C26 55 25 48 26 41 C25 37 25 34 26 31 C24 24 24 14 25 2 Z" />
      <circle cx={knieX} cy={35.5} r={6.5} className="bein-knie-ring" />
      <circle cx={knieX} cy={35.5} r={2.4} className="bein-knie" />
    </svg>
  )
}
