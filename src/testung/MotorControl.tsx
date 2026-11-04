// Block „Motor Control“ in der Testung (Philipp 04.11.2026): je Test Kompensationen je Segment ankreuzen,
// Score nach Aspetar automatisch, Freitext. Nur Info – keine Ampel, zählt nicht für RTS oder „Tests erfasst“.

import { useState } from 'react'
import type { MotorSeite, MotorTest, Testung } from '../db'
import { MOTOR, SEGMENTE, segmentName, type MotorTestDef } from '../katalog/motorcontrol'
import { istBewertet, score, scoreKurz, scoreText, seitenunterschied, seitenVon, TEXT_MAX, type MotorSeiteId } from './motorik'
import type { Seitennamen } from './TestKarte'

const STATUS: [MotorSeite['status'] | '', string][] = [
  ['', 'nicht bewertet'],
  ['bewertet', 'bewertet'],
  ['nicht_durchfuehrbar', 'nicht verlässlich durchführbar'],
]

function Seite({ def, titel, wert, setze }: { def: MotorTestDef; titel: string; wert: MotorSeite | undefined; setze: (s: MotorSeite | undefined) => void }) {
  const liste = MOTOR.listen[def.liste]
  const status = wert?.status ?? ''
  const umschalten = (k: string) => {
    const neu = wert?.kompensationen.includes(k) ? wert.kompensationen.filter((x) => x !== k) : [...(wert?.kompensationen ?? []), k]
    setze({ status: 'bewertet', kompensationen: neu })
  }
  return (
    <div className="mc-seite" role="group" aria-label={`${def.name} – ${titel}`}>
      <div className="mc-seite-kopf">
        <strong>{titel}</strong>
        <span className="mc-score" aria-label={`Score ${titel}`}>
          {scoreText(score(wert))}
        </span>
      </div>
      <div className="auswahl">
        {STATUS.map(([s, text]) => (
          <button
            key={s}
            type="button"
            className="auswahl-knopf"
            aria-pressed={status === s}
            onClick={() => setze(s === '' ? undefined : { status: s, kompensationen: s === 'bewertet' ? (wert?.kompensationen ?? []) : [] })}
          >
            {text}
          </button>
        ))}
      </div>
      {status === 'bewertet' && (
        <div className="mc-segmente">
          {SEGMENTE.map((seg) => {
            const auffaellig = wert!.kompensationen.some((k) => k.startsWith(`${seg}:`))
            return (
              <fieldset key={seg} className="mc-segment">
                <legend>
                  {segmentName(seg)} <span className={auffaellig ? 'mc-auffaellig' : 'mc-ruhig'}>{auffaellig ? 'auffällig' : 'ohne Kompensation'}</span>
                </legend>
                {liste[seg].map((k) => {
                  const schluessel = `${seg}:${k.id}`
                  return (
                    <label key={k.id} className="mc-kompensation" title={k.original}>
                      <input type="checkbox" checked={wert!.kompensationen.includes(schluessel)} onChange={() => umschalten(schluessel)} />
                      {k.name}
                    </label>
                  )
                })}
              </fieldset>
            )
          })}
        </div>
      )}
    </div>
  )
}

function McTest({ def, wert, setze, seiten }: { def: MotorTestDef; wert: MotorTest | undefined; setze: (t: MotorTest | undefined) => void; seiten: Seitennamen }) {
  const [offen, setOffen] = useState(istBewertet(wert) || !!wert?.text)
  const kurz = scoreKurz(def, wert)
  const titel = (s: MotorSeiteId) => (s === 'b' ? seiten.betroffen : s === 'g' ? seiten.gesund : 'beidbeinig')
  const aendern = (teil: Partial<MotorTest>) => {
    const neu = { ...wert, ...teil }
    const leer = !istBewertet(neu) && !neu.text
    setze(leer ? undefined : neu)
  }
  return (
    <article className="test-karte mc-test" id={`test-${def.id}`} aria-labelledby={`titel-${def.id}`}>
      <header className="test-kopf">
        <h3 id={`titel-${def.id}`}>{def.name}</h3>
        <span className="test-kopf-rechts">
          {seitenunterschied(wert) && <span className="ampel-marke ampel-offen mc-hinweis">betroffen weniger Punkte als gesund</span>}
          <span className="mc-score-kopf">{kurz ?? 'nicht bewertet'}</span>
          <button type="button" className="test-klapp" aria-expanded={offen} aria-label={`${def.name} ${offen ? 'zuklappen' : 'aufklappen'}`} onClick={() => setOffen((x) => !x)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m6 3.5 4.5 4.5L6 12.5" />
            </svg>
          </button>
        </span>
      </header>
      {offen && (
        <>
          <div className={`mc-seiten${def.einbeinig ? ' mc-zwei' : ''}`}>
            {seitenVon(def).map((s) => (
              <Seite key={s} def={def} titel={titel(s)} wert={wert?.[s]} setze={(x) => aendern({ [s]: x })} />
            ))}
          </div>
          <label className="feld mc-text">
            <span className="feld-label">Beobachtung (optional)</span>
            <textarea rows={2} maxLength={TEXT_MAX} value={wert?.text ?? ''} onChange={(e) => aendern({ text: e.target.value.slice(0, TEXT_MAX) || undefined })} />
            <span className="feld-hilfe">
              Keine Namen eintragen · {(wert?.text ?? '').length}/{TEXT_MAX} Zeichen
            </span>
          </label>
          <p className="kat-quelle">Quelle: {MOTOR.quelle}, {def.quelle}</p>
        </>
      )}
    </article>
  )
}

export default function MotorControl({ testung, setze, seiten }: { testung: Pick<Testung, 'motorControl'>; setze: (id: string, t: MotorTest | undefined) => void; seiten: Seitennamen }) {
  return (
    <div id="block-motor" className="testung-block">
      <div className="testung-block-kopf">
        <h2 className="testung-block-titel">Motor Control</h2>
      </div>
      <p className="hinweis-leise mc-erklaerung">
        Score je Segment (Fuß/Sprunggelenk, Knie, Hüfte/Rumpf): ein Punkt ohne Kompensation, 3/3 = keine. Nur Info – keine Ampel, kein Einfluss auf den
        RTS-Vorschlag.
      </p>
      {MOTOR.tests.map((def) => (
        <McTest key={def.id} def={def} wert={testung.motorControl?.[def.id]} setze={(t) => setze(def.id, t)} seiten={seiten} />
      ))}
    </div>
  )
}
