// Gemeinsame Bausteine von Arztbericht und Pat./Trainer-Bericht (aus pages/Bericht.tsx, Audit L2).

import { createContext, useContext, type ReactNode } from 'react'
import type { Testung } from '../db'
import { HINWEIS } from '../navigation'
import { AMPEL_ZEICHEN, type Bewertung } from './bericht'


export const logoUrl = `${import.meta.env.BASE_URL}logo-pzl.svg`
export const PRAXIS = 'Physio Zentrum Linz'

/** Name für den Ausdruck – nur im Arbeitsspeicher der Berichtsseite, nie gespeichert (F9). */
export const NameKontext = createContext('')

/** Testungen bis einschließlich dieser (nach Datum) – spätere gehören nicht in den Bericht. */
export const bisZu = (alle: Testung[], t: Testung) => alle.filter((x) => x.id === t.id || x.datum <= t.datum)

/** gewähltes Diagramm, sonst Knie-Extension (HHD), sonst das erste mit Werten */
export const waehleOption = <T extends { id: string }>(optionen: T[], wahl: string): T =>
  optionen.find((o) => o.id === wahl) ?? optionen.find((o) => o.id === 'hhd_knie_ext') ?? optionen[0]

/** Ampel als Chip wie im Designsystem: Zeichen + Wort, Ampelfarbe, Fläche 12 % (Bericht-Redesign) */
export function BewertungMarke({ b }: { b: Bewertung }) {
  return (
    <span className={`bericht-chip ampel-${b.ampel ?? 'offen'}`}>
      {b.ampel && <span aria-hidden="true">{AMPEL_ZEICHEN[b.ampel]} </span>}
      {b.text}
    </span>
  )
}

// ---------- gemeinsame Bausteine (Bericht-Redesign, Muster 27.10.2026) ----------

/** Strichsymbole wie in der Seitenleiste (Strich 1,6) */
export const SYMBOLE = {
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c.8-3.6 3.9-6 7.5-6s6.7 2.4 7.5 6',
  datum: 'M5.5 5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3.5 10h17M8 3v4M16 3v4',
  phase: 'M3 19h5v-5h5V9h5V4h3',
  zeit: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM12 7.5V12l3 2',
  seite: 'M10 3c0 4 1 6 1 9s-2 5-2 8M14 3c0 4 1 6 1 9s-1 5 1 8',
  graft: 'M6 18 18 6M6 15.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM18 3.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z',
  liste: 'M9 6h11M9 12h11M9 18h11M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17',
  kreis: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM8 12h8',
  info: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17ZM12 11v5M12 8h.01',
} as const
export type SymbolName = keyof typeof SYMBOLE

export function Symbol({ name }: { name: SymbolName }) {
  return (
    <svg viewBox="0 0 24 24" className="bericht-symbol" aria-hidden="true">
      <path d={SYMBOLE[name]} />
    </svg>
  )
}

export type KontextEintrag = [label: string, wert: string, symbol: SymbolName]

export function Kopf({ titel, kuerzel, unter, entwurf, kontext }: { titel: string; kuerzel: string; unter: string; entwurf: boolean; kontext: KontextEintrag[] }) {
  // Name nur aus dem Kontext – Tippen im Namensfeld rendert nur den Kopf neu, nicht den ganzen Bericht (Audit L2)
  const name = useContext(NameKontext)
  return (
    <header className="bericht-kopf">
      <div className="bericht-kopfzeile">
        <div className="bericht-marke">
          <img src={logoUrl} alt={PRAXIS} width={480} height={180} className="bericht-logo" />
          <span className="bericht-praxis">{PRAXIS}</span>
        </div>
        <div className="bericht-art">
          {titel}
          {entwurf && <span className="bericht-entwurf">ENTWURF – Testung nicht abgeschlossen</span>}
        </div>
      </div>
      <div className="bericht-titelzeile">
        <h2 className="bericht-titel" translate="no">{kuerzel}</h2>
        {name.trim() && (
          <span className="bericht-name">
            <Symbol name="person" />
            {name.trim()}
          </span>
        )}
        {unter && <span className="bericht-unter">{unter}</span>}
      </div>
      <dl className="bericht-kontext">
        {kontext.map(([k, v, s]) => (
          <div key={k}>
            <Symbol name={s} />
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </header>
  )
}

/** Abschnitt mit Titelzeile über die volle Breite; die Nummer dient zum Verweisen („siehe 4“). */
export function Abschnitt({ nr, titel, notiz, className, children }: { nr: string | number; titel: string; notiz?: string; className?: string; children: ReactNode }) {
  return (
    <section className={`bericht-abschnitt${className ? ` ${className}` : ''}`}>
      <div className="bericht-abschnitt-kopf">
        <span className="bericht-nr">{nr}</span>
        <h2>{titel}</h2>
        {notiz && <p>{notiz}</p>}
      </div>
      {children}
    </section>
  )
}

export function Tafel({ titel, symbol, className, children }: { titel?: string; symbol?: SymbolName; className?: string; children: ReactNode }) {
  return (
    <div className={`bericht-tafel bericht-tafel-innen${className ? ` ${className}` : ''}`}>
      {titel && (
        <h3 className="bericht-tafel-titel">
          {symbol && <Symbol name={symbol} />}
          {titel}
        </h3>
      )}
      {children}
    </div>
  )
}

export function Fuss() {
  return <p className="bericht-fuss">{HINWEIS}.</p>
}

/** „Titel: Text“ → [Titel, Text]; ohne Doppelpunkt [null, Text] – nur für die Darstellung, der Text bleibt gleich. */
export function teile(text: string): [string | null, string] {
  const i = text.indexOf(': ')
  return i < 0 ? [null, text] : [text.slice(0, i), text.slice(i + 2)]
}

/** „12 von 13 Pflicht-Tests erfüllt“ mit großen Zahlen – gleicher Text. */
export function Zaehlung({ text }: { text: string }) {
  const m = /^(\d+) von (\d+) (.+)$/.exec(text)
  if (!m) return <strong className="bericht-zaehlung">{text}</strong>
  return (
    <strong className="bericht-zaehlung">
      {m[1]} <small>von</small> {m[2]} <small>{m[3]}</small>
    </strong>
  )
}

