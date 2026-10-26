import { antwortFeld, FRAGEBOEGEN } from './fragebogen'
import type { TestEingabe } from './erfassung'

const text = (v: number) => v.toLocaleString('de-AT', { maximumFractionDigits: 1 })

/** Antworten vom Papier abtippen → Score; „übernehmen“ trägt ihn in das Score-Feld ein (ENTSCHEIDUNGEN 8). */
export default function FragebogenRechner({ testId, eingabe: e, setze }: { testId: string; eingabe: TestEingabe; setze: (feld: string, wert: string) => void }) {
  const fb = FRAGEBOEGEN[testId]
  if (!fb) return null
  const ergebnis = fb.rechne(e)
  const begonnen = fb.gruppen.some((g) => g.items.some((i) => (e[antwortFeld(i.id)] ?? '') !== ''))

  return (
    <details className="test-mehr fragebogen" open={begonnen}>
      <summary>Score-Rechner (Antworten vom Papier abtippen)</summary>
      <p className="hinweis-leise">{fb.hilfe}</p>
      {fb.gruppen.map((g) => (
        <fieldset key={g.name} className="metrik-gruppe fragebogen-gruppe">
          <legend>{g.name}</legend>
          {g.items.map((i) => {
            const f = antwortFeld(i.id)
            return i.janein ? (
              <span key={i.id} className="fragebogen-item">
                <span className="fragebogen-nr">{i.id}</span>
                <span className="auswahl">
                  {(['ja', 'nein'] as const).map((w) => (
                    <button key={w} type="button" className="auswahl-knopf" aria-pressed={e[f] === w} onClick={() => setze(f, e[f] === w ? '' : w)}>
                      {w === 'ja' ? 'Ja' : 'Nein'}
                    </button>
                  ))}
                </span>
              </span>
            ) : (
              <label key={i.id} className="fragebogen-item">
                <span className="fragebogen-nr">{i.id}</span>
                <input inputMode="numeric" value={e[f] ?? ''} onChange={(x) => setze(f, x.target.value)} aria-label={`Item ${i.id}`} placeholder={`${i.min}–${i.max}`} />
              </label>
            )
          })}
        </fieldset>
      ))}
      {ergebnis.meldungen.map((m) => (
        <p key={m} className="meldung meldung-warnung">
          {m}
        </p>
      ))}
      <div className="aktionen fragebogen-ergebnis">
        {ergebnis.werte.map((w) => (
          <span key={w.feld}>
            {w.name}: <strong>{w.score === null ? '–' : text(w.score)}</strong>
          </span>
        ))}
        <button
          type="button"
          className="knopf knopf-haupt"
          disabled={ergebnis.werte.every((w) => w.score === null)}
          onClick={() => ergebnis.werte.forEach((w) => w.score !== null && setze(w.feld, text(w.score)))}
        >
          <span>Ergebnis übernehmen</span>
        </button>
      </div>
    </details>
  )
}
