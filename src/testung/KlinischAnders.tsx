import type { KlinischAnders as KlinischAndersWert } from '../db'
import type { PflichtStatus } from './rts'

const AMPEL_STATUS: Record<PflichtStatus, string> = { erfuellt: 'erfüllt', nicht_erfuellt: 'nicht erfüllt', fehlt: 'noch offen' }

/** „Klinisch anders beurteilt“ je Test (F33) – zählt nur mit Begründung. */
export default function KlinischAnders({
  wert,
  setze,
  ampelStatus,
}: {
  wert: KlinischAndersWert | undefined
  setze: (w: KlinischAndersWert) => void
  ampelStatus: PflichtStatus
}) {
  const w: KlinischAndersWert = wert ?? { urteil: '', begruendung: '' }
  const aktiv = w.urteil !== ''
  const ohneBegruendung = aktiv && w.begruendung.trim() === ''
  return (
    <details className={`test-mehr klinisch-anders${aktiv && !ohneBegruendung ? ' klinisch-aktiv' : ''}`} open={aktiv}>
      <summary>Klinisch anders beurteilen{aktiv && !ohneBegruendung ? ' (aktiv)' : ''}</summary>
      <p className="hinweis-leise">Nach Ampel: {AMPEL_STATUS[ampelStatus]}. Eine abweichende Beurteilung braucht eine Begründung und wird im Bericht markiert.</p>
      <div className="auswahl">
        {(
          [
            ['', 'wie Ampel'],
            ['erfuellt', 'als erfüllt werten'],
            ['nicht_erfuellt', 'als nicht erfüllt werten'],
          ] as const
        ).map(([u, text]) => (
          <button key={u} type="button" className="auswahl-knopf" aria-pressed={w.urteil === u} onClick={() => setze({ ...w, urteil: u })}>
            {text}
          </button>
        ))}
      </div>
      {aktiv && (
        <label className={`feld${ohneBegruendung ? ' feld-fehler' : ''}`}>
          <span className="feld-label">
            Begründung <span className="block-marke">Pflicht</span>
          </span>
          <textarea rows={2} value={w.begruendung} onChange={(e) => setze({ ...w, begruendung: e.target.value })} />
          {ohneBegruendung && <span className="feld-meldung">Ohne Begründung wird die Beurteilung nicht berücksichtigt.</span>}
        </label>
      )}
    </details>
  )
}
