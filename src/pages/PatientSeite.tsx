import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db, type Testung } from '../db'
import Laedt from '../Laedt'
import { phaseNach } from '../katalog'
import { letzterStand, lsiKennzahl, nachDatum } from '../patienten/uebersicht'
import { BEGLEIT_OPS, GRAFTS, monateSeit, NIVEAUS, type Patient } from '../patienten/stammdaten'
import { phaseAusMonaten } from '../testung/ablauf'
import Ladebalken, { AmpelMarke } from '../testung/Ladebalken'
import PatientTestungen, { useNeueTestung } from '../testung/PatientTestungen'
import VerlaufBereich from '../testung/VerlaufBereich'
import PatientFormular from './PatientFormular'

const REITER = [
  ['uebersicht', 'Übersicht'],
  ['testungen', 'Testungen'],
  ['stammdaten', 'Stammdaten'],
] as const
type ReiterId = (typeof REITER)[number][0]

/** LSI-Kennzahlen der Übersicht – einzelne Tests, kein Durchschnitt (DESIGNKONZEPT 7). */
const KENNZAHL_TESTS = ['hhd_knie_ext', 'single_hop']

/** Seite eines Kürzels als Dashboard mit Reitern (DESIGNKONZEPT 7). Alle Reiter bleiben geladen, damit Eingaben im Formular beim Wechseln erhalten bleiben. */
export default function PatientSeite() {
  const { id = '' } = useParams()
  const patient = useLiveQuery(async () => (await db.patienten.get(id)) ?? null, [id])
  const testungen = useLiveQuery(() => db.testungen.where('patientId').equals(id).toArray(), [id])
  const [reiter, setReiter] = useState<ReiterId>('uebersicht')
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
            <h2 className="seitentitel">{patient.kuerzel}</h2>
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
        {REITER.map(([rid, name]) => (
          <button
            key={rid}
            type="button"
            role="tab"
            id={`reiter-${rid}`}
            aria-selected={reiter === rid}
            aria-controls={`bereich-${rid}`}
            onClick={() => setReiter(rid)}
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
  const kennzahlen = KENNZAHL_TESTS.map((t) => lsiKennzahl(patient, testungen, t)).filter((k) => k !== null)
  const letzte = nachDatum(testungen)[0]

  return (
    <>
      {stand ? (
        <section className="karte karte-laut status-letzte" aria-label="Stand der letzten Testung">
          <div className="status-aussage">
            <span className="status-herkunft">{stand.herkunft}</span>
            <h3 className="status-titel">{stand.aussage}</h3>
            <span className="status-herkunft">
              {stand.titel} · {stand.fortschritt.erfasst} von {stand.fortschritt.gesamt} Tests erfasst ·{' '}
              <span className={`status${stand.abgeschlossen ? '' : ' status-arbeit'}`}>{stand.abgeschlossen ? 'abgeschlossen' : 'in Arbeit'}</span>
            </span>
            {stand.endtestung && <span className="status-herkunft">Ersetzt keine ärztliche Freigabe.</span>}
            {stand.warnung && <p className="status-warnung">⚠ {stand.warnung} – blockiert nicht.</p>}
          </div>
          <div>
            <h3 className="block-titel">{stand.endtestung ? 'Was fehlt noch?' : 'Noch nicht erfüllt oder offen'}</h3>
            {stand.offen.length > 0 ? (
              <ul className="status-offen">
                {stand.offen.map((o) => (
                  <li key={o.text}>
                    <AmpelMarke ampel={o.ampel} />
                    <span>{o.text}</span>
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
        <div className="dashboard-spalte">
          <Kopfkarte patient={patient} letzte={letzte} />
          {kennzahlen.map((k) => (
            <section key={k.testId} className="karte kennzahl" aria-label={`LSI ${k.name}`}>
              <div className="kennzahl-kopf">
                <span className="kennzahl-name">LSI {k.name}</span>
                <AmpelMarke ampel={k.ampel} />
              </div>
              <p className="kennzahl-zahl">
                {k.wert.toLocaleString('de-AT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                <small>%</small>
              </p>
              {k.ampel && k.ziel !== null && <Ladebalken wert={k.wert} ziel={k.ziel} ampel={k.ampel} />}
              <p className="kennzahl-bezug">
                Testung vom {k.datum}
                {k.ziel !== null && `, Ziel ≥ ${k.ziel} %`}
              </p>
            </section>
          ))}
          {testungen.length > 0 && (
            <button type="button" className="knopf kennzahl-testungen" onClick={zuTestungen}>
              <span>Alle {testungen.length} Testungen ansehen</span>
            </button>
          )}
        </div>
        <div className="dashboard-spalte">
          <VerlaufBereich patient={patient} />
        </div>
      </div>
    </>
  )
}

function Kopfkarte({ patient: p, letzte }: { patient: Patient; letzte?: { tegnerAktuell: string; koerpergewichtKg: string } }) {
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
