import type { ReactNode } from 'react'
import { protokollNach } from '../katalog'
import type { TestDef } from '../katalog/typen'
import type { KriteriumErgebnis, TestErgebnis } from '../rechnen/bewertung'
import { ERFASSUNG, KOOS_SUBSKALEN, VERSUCHE, type Berechnung, type TestEingabe } from './erfassung'
import { istMeloqTest } from '../katalog/meloq'
import Ladebalken, { AMPEL_TEXT, AmpelMarke } from './Ladebalken'
import FragebogenRechner from './FragebogenRechner'
import MeloqBereich, { KernStrategie } from './MeloqBereich'
import type { MeloqAuswahl } from './meloqAuswahl'
import type { NormAnzeige } from './normdaten'

export interface Seitennamen {
  gesund: string
  betroffen: string
}

interface Props {
  test: TestDef
  eingabe: TestEingabe
  setze: (feld: string, wert: string) => void
  seiten: Seitennamen
  berechnung: Berechnung
  ergebnis: TestErgebnis
  koerpergewichtFehlt: boolean
  /** persönlicher Meloq-Standard (nur Platten-Tests) */
  meloqAuswahl?: MeloqAuswahl
  koerpergewichtKg: number | null
  /** z. B. „klinisch anders beurteilen“ – unten in der Karte */
  fuss?: ReactNode
  /** Hinweise oben in der Karte, z. B. „HHD erst ab 8 Wochen“ */
  hinweise?: string[]
  /** Normdaten als graue Zusatzinfo (ohne Einfluss auf die Ampel) */
  normdaten?: NormAnzeige | null
}

const zahl = (v: number, nachkomma = 1) =>
  v.toLocaleString('de-AT', { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma })
const ZEICHEN = { '>': '>', '>=': '≥', '<': '<', '<=': '≤' } as const

/** Eingabefeld für eine Zahl (Komma oder Punkt). */
function Zahl({ wert, onChange, label, einheit, breit = false }: { wert?: string; onChange: (v: string) => void; label: string; einheit?: string; breit?: boolean }) {
  return (
    <label className={`zahl-feld${breit ? ' zahl-feld-breit' : ''}`}>
      <span className="sr-only">{label}</span>
      <input inputMode="decimal" value={wert ?? ''} onChange={(e) => onChange(e.target.value)} aria-label={label} placeholder="–" />
      {einheit && <span className="zahl-einheit">{einheit}</span>}
    </label>
  )
}

function Knoepfe({ optionen, wert, onChange }: { optionen: [string, string][]; wert?: string; onChange: (v: string) => void }) {
  return (
    <div className="auswahl">
      {optionen.map(([w, text]) => (
        <button key={w} type="button" className="auswahl-knopf" aria-pressed={wert === w} onClick={() => onChange(wert === w ? '' : w)}>
          {text}
        </button>
      ))}
    </div>
  )
}

/** Raster: Zeilen = Seiten (oder Versuche), Spalten = Versuche (oder Messgrößen). */
function Raster({ kopf, zeilen }: { kopf: ReactNode[]; zeilen: { titel: ReactNode; zellen: ReactNode[] }[] }) {
  return (
    <table className="eingabe-raster">
      <thead>
        <tr>
          <th />
          {kopf.map((k, i) => (
            <th key={i}>{k}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {zeilen.map((z, i) => (
          <tr key={i}>
            <th scope="row">{z.titel}</th>
            {z.zellen.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Eingaben({ test, eingabe: e, setze, seiten, berechnung }: Props) {
  const art = ERFASSUNG[test.id]
  const best = (w: number | null | undefined, einheit: string) => <span className="bestwert">{w === null || w === undefined ? '–' : `${zahl(w, w % 1 === 0 ? 0 : 2)} ${einheit}`}</span>
  const einheitWahl = (
    <div className="einheit-wahl">
      <Knoepfe optionen={[['kg', 'kg'], ['N', 'N']]} wert={e.einheit === 'N' ? 'N' : 'kg'} onChange={(v) => setze('einheit', v || 'kg')} />
    </div>
  )
  const seitenVersuche = (einheit: string, praefix = '') =>
    (['g', 'b'] as const).map((s) => ({
      titel: s === 'g' ? seiten.gesund : seiten.betroffen,
      zellen: [
        ...VERSUCHE.map((n) => <Zahl key={n} wert={e[`${praefix}${s}${n}`]} onChange={(v) => setze(`${praefix}${s}${n}`, v)} label={`${s === 'g' ? seiten.gesund : seiten.betroffen} Versuch ${n}`} />),
        best(s === 'g' ? berechnung.seiten?.gesund : berechnung.seiten?.betroffen, einheit),
      ],
    }))
  const sprungSeiten = (felder: [string, string][]) =>
    (['g', 'b'] as const).flatMap((s) =>
      VERSUCHE.map((n) => ({
        titel: (
          <>
            {n === 1 && <span className="raster-seite">{s === 'g' ? seiten.gesund : seiten.betroffen}</span>}
            <span className="raster-versuch">Versuch {n}</span>
          </>
        ),
        zellen: felder.map(([f, label]) => <Zahl key={f} wert={e[`${s}${n}_${f}`]} onChange={(v) => setze(`${s}${n}_${f}`, v)} label={`${s === 'g' ? seiten.gesund : seiten.betroffen} Versuch ${n} ${label}`} />),
      })),
    )

  switch (art?.typ) {
    case 'auswahl': {
      const k = test.kriterien[0]
      return <Knoepfe optionen={(k.optionen ?? []).map((o) => [o, o])} wert={e.wert} onChange={(v) => setze('wert', v)} />
    }
    case 'janein':
      return <Knoepfe optionen={[['ja', 'kein Lag'], ['nein', 'Lag vorhanden']]} wert={e.wert} onChange={(v) => setze('wert', v)} />
    case 'defizit':
      return <Zahl wert={e.wert} onChange={(v) => setze('wert', v)} label="Extensionsdefizit betroffen" einheit="° Defizit (betroffen)" breit />
    case 'score':
      return <Zahl wert={e.wert} onChange={(v) => setze('wert', v)} label="Score" einheit="Punkte" breit />
    case 'flexion':
    case 'einzeln': {
      const einheit = art.typ === 'flexion' ? '°' : art.einheit
      return (
        <div className="seiten-paar">
          <Zahl wert={e.g} onChange={(v) => setze('g', v)} label={seiten.gesund} einheit={`${einheit} · ${seiten.gesund}`} breit />
          <Zahl wert={e.b} onChange={(v) => setze('b', v)} label={seiten.betroffen} einheit={`${einheit} · ${seiten.betroffen}`} breit />
        </div>
      )
    }
    case 'direkt':
      return (
        <div className="seiten-paar">
          {art.felder.map((f) => (
            <Zahl key={f.kriterium} wert={e[f.kriterium]} onChange={(v) => setze(f.kriterium, v)} label={f.label} einheit={`${f.einheit} · ${f.label}`} breit />
          ))}
        </div>
      )
    case 'koos':
      return (
        <div className="seiten-paar">
          {KOOS_SUBSKALEN.map(([id, name]) => (
            <Zahl key={id} wert={e[`koos_${id}`]} onChange={(v) => setze(`koos_${id}`, v)} label={name} einheit={name} breit />
          ))}
        </div>
      )
    case 'kraft': {
      const einheit = e.einheit === 'N' ? 'N' : 'kg'
      return (
        <>
          {einheitWahl}
          <Raster kopf={['Versuch 1', 'Versuch 2', 'Versuch 3', 'Bestwert']} zeilen={seitenVersuche(einheit)} />
        </>
      )
    }
    case 'versuche':
      return <Raster kopf={['Versuch 1', 'Versuch 2', 'Versuch 3', 'Bestwert']} zeilen={seitenVersuche(art.einheit)} />
    case 'imtp': {
      const einheit = e.einheit === 'N' ? 'N' : 'kg'
      return (
        <>
          {einheitWahl}
          <Raster
            kopf={['Versuch 1', 'Versuch 2', 'Versuch 3']}
            zeilen={[{ titel: `Peak Force (${einheit})`, zellen: VERSUCHE.map((n) => <Zahl key={n} wert={e[`v${n}`]} onChange={(v) => setze(`v${n}`, v)} label={`Versuch ${n}`} />) }]}
          />
        </>
      )
    }
    case 'cmj':
      return (
        <Raster
          kopf={['Sprunghöhe (cm)', 'Net Impulse L (kg·s)', 'Net Impulse R (kg·s)', 'Contraction Time (ms)']}
          zeilen={VERSUCHE.map((n) => ({
            titel: `Versuch ${n}`,
            zellen: (['hoehe', 'impL', 'impR', 'ct'] as const).map((f) => <Zahl key={f} wert={e[`v${n}_${f}`]} onChange={(v) => setze(`v${n}_${f}`, v)} label={`Versuch ${n} ${f}`} />),
          }))}
        />
      )
    case 'sl_sprung':
      return (
        <Raster
          kopf={['Sprunghöhe (cm)', 'Net Impulse (kg·s)', 'Contraction Time (ms)']}
          zeilen={sprungSeiten([['hoehe', 'Höhe'], ['imp', 'Net Impulse'], ['ct', 'Contraction Time']])}
        />
      )
    case 'sl_dj':
      return <Raster kopf={['Sprunghöhe (cm)', 'RSI', 'Kontaktzeit (ms)']} zeilen={sprungSeiten([['hoehe', 'Höhe'], ['rsi', 'RSI'], ['kz', 'Kontaktzeit']])} />
    default:
      return null
  }
}

function KriteriumZeile({ e }: { e: KriteriumErgebnis }) {
  const k = e.kriterium
  if (e.zustand === 'nicht_anwendbar') return null
  const nachkomma = k.art === 'lsi' ? 1 : (k.nachkomma ?? 1)
  const einheit = k.einheit === '%' ? ' %' : k.einheit ? ` ${k.einheit}` : ''
  const wertText =
    typeof e.wert === 'number' ? `${zahl(e.wert, nachkomma)}${einheit}` : typeof e.wert === 'boolean' ? (e.wert ? 'ja' : 'nein') : (e.wert ?? '–')
  const ziel =
    k.art === 'auswahl'
      ? `Ziel ${k.erlaubt?.join(' / ')}`
      : k.art === 'janein'
        ? 'Ziel: ja'
        : e.schwelle && k.vergleich
          ? `Ziel ${ZEICHEN[k.vergleich]} ${zahl(e.schwelle.wert, k.art === 'lsi' ? 0 : nachkomma)}${einheit}`
          : 'ohne Schwelle'
  const markeText = k.status === 'warnung' && e.ampel === 'gelb' ? 'Warnung' : undefined
  return (
    <div className={`kriterium-zeile${e.zaehlt || e.zustand !== 'bewertet' ? '' : ' kriterium-nebensache'}`}>
      <span className="kriterium-name">
        {k.bezeichnung}
        {k.status !== 'pflicht' && <span className="kriterium-status"> · {k.status === 'wuenschenswert' ? 'wünschenswert' : k.status}</span>}
      </span>
      <span className="kriterium-wert">{wertText}</span>
      <span className="kriterium-ziel">{ziel}</span>
      <span className="kriterium-ampel">
        {e.zustand === 'bewertet' && e.ampel ? <AmpelMarke ampel={e.ampel} text={markeText} /> : e.zustand === 'info' ? <span className="ampel-marke ampel-offen">Info</span> : <AmpelMarke ampel={null} />}
      </span>
      {k.art === 'lsi' && typeof e.wert === 'number' && e.ampel && e.schwelle && (
        <span className="kriterium-balken">
          <Ladebalken wert={e.wert} ziel={e.schwelle.wert} ampel={e.ampel} />
        </span>
      )}
    </div>
  )
}

export default function TestKarte(props: Props) {
  const { test, eingabe: e, setze, berechnung: b, ergebnis, koerpergewichtFehlt } = props
  const protokoll = test.protokoll ? protokollNach(test.protokoll) : undefined
  const art = ERFASSUNG[test.id]?.typ
  // Vorverletzungswert nur dort, wo ein Seitenwert der betroffenen Seite entsteht
  const mitMehr = test.seitenvergleich && art !== 'flexion' && art !== 'cmj'
  const mitHebel = art === 'kraft'

  return (
    <article className="test-karte" id={`test-${test.id}`} aria-labelledby={`titel-${test.id}`}>
      <header className="test-kopf">
        <h4 id={`titel-${test.id}`}>
          {test.name}
          {test.optional && <span className="chip">optional</span>}
        </h4>
        <AmpelMarke ampel={ergebnis.ampel} text={ergebnis.ampel ? `${AMPEL_TEXT[ergebnis.ampel]}${ergebnis.vollstaendig ? '' : ' (unvollständig)'}` : undefined} />
      </header>

      {props.hinweise?.map((h) => (
        <p key={h} className="meldung meldung-warnung test-hinweis">
          {h}
        </p>
      ))}

      {/* 1. Ergebnis (laut) */}
      <div className="test-ergebnis">
        {ergebnis.kriterien.map((k) => (
          <KriteriumZeile key={k.kriterium.id} e={k} />
        ))}
        {istMeloqTest(test.id) && <KernStrategie test={test.id} eingabe={e} berechnung={b} seiten={props.seiten} />}
        {b.lsiVorverletzung !== null && (
          <p className="test-zusatz">LSI zur Vorverletzung: {zahl(b.lsiVorverletzung, 1)} %</p>
        )}
        {b.nmProKg && (
          <p className="test-zusatz">
            Drehmoment: {props.seiten.gesund} {b.nmProKg.gesund === null ? '–' : zahl(b.nmProKg.gesund, 2)} · {props.seiten.betroffen}{' '}
            {b.nmProKg.betroffen === null ? '–' : zahl(b.nmProKg.betroffen, 2)} Nm/kg
          </p>
        )}
        {b.brauchtKoerpergewicht && koerpergewichtFehlt && <p className="meldung meldung-warnung">Für relative Werte fehlt das Körpergewicht (oben).</p>}
        {b.streuung.map((s) => (
          <p key={s.seite} className="meldung meldung-warnung">
            Messung wiederholen? Die Versuche {s.seite === 'beide' ? '' : `(${s.seite === 'gesund' ? props.seiten.gesund : props.seiten.betroffen}) `}
            streuen um {zahl(s.cv, 1)} % (mehr als 10 %).
          </p>
        ))}
        {ergebnis.hinweise.map((h) => (
          <p key={h} className="meldung meldung-info">
            {h}
          </p>
        ))}
      </div>

      {/* 2. Eingabe */}
      <div className="test-eingabe">
        <Eingaben {...props} />
      </div>

      <FragebogenRechner testId={test.id} eingabe={e} setze={setze} />

      {istMeloqTest(test.id) && props.meloqAuswahl && (
        <MeloqBereich
          test={test.id}
          eingabe={e}
          setze={setze}
          seiten={props.seiten}
          berechnung={b}
          auswahl={props.meloqAuswahl}
          kg={props.koerpergewichtKg}
        />
      )}


      {/* 3. Mehr (leise, zugeklappt) */}
      <div className="test-leise">
        {(protokoll || test.hinweise?.length) && (
          <details className="test-protokoll">
            <summary>Protokoll & Warum</summary>
            {protokoll && (
              <>
                <p>{protokoll.ablauf}</p>
                <p>
                  <strong>Warum:</strong> {protokoll.warum} <span className="kat-quelle">({protokoll.quelle})</span>
                </p>
                {protokoll.winkelGrad !== undefined && (
                  <label className="protokoll-wert">
                    Winkel tatsächlich
                    <Zahl wert={e.winkel} onChange={(v) => setze('winkel', v)} label="Winkel tatsächlich" einheit={`° (Standard ${protokoll.winkelGrad}°)`} />
                  </label>
                )}
                {protokoll.boxhoeheCm !== undefined && (
                  <label className="protokoll-wert">
                    Boxhöhe tatsächlich
                    <Zahl wert={e.box} onChange={(v) => setze('box', v)} label="Boxhöhe tatsächlich" einheit={`cm (Standard ${protokoll.boxhoeheCm} cm)`} />
                  </label>
                )}
              </>
            )}
            {test.hinweise?.map((h) => (
              <p key={h} className="hinweis-leise">
                {h}
              </p>
            ))}
          </details>
        )}
        {props.normdaten && (
          <details className="test-mehr test-normdaten">
            <summary>Normdaten (typisch nach VKB-OP)</summary>
            <div className="normdaten">
            {props.normdaten.keine ? (
              <p>{props.normdaten.keine}</p>
            ) : (
              <>
                <p className="normdaten-kopf">{props.normdaten.kopf} – nur Info, ohne Einfluss auf die Ampel</p>
                {props.normdaten.zeilen.map((z) => (
                  <p key={z}>{z}</p>
                ))}
              </>
            )}
            {props.normdaten.hinweis && <p>{props.normdaten.hinweis}</p>}
            </div>
          </details>
        )}
        {mitMehr && (
          <details className="test-mehr" open={!!(e.hebel || e.vor)}>
            <summary>Hebelarm, Vorverletzung</summary>
            <div className="seiten-paar">
              {mitHebel && <Zahl wert={e.hebel} onChange={(v) => setze('hebel', v)} label="Hebelarm" einheit="m Hebelarm (für Nm/kg)" breit />}
              <Zahl wert={e.vor} onChange={(v) => setze('vor', v)} label="Vorverletzungswert" einheit="Vorverletzungswert (betroffene Seite, gleiche Einheit)" breit />
            </div>
          </details>
        )}
        {props.fuss}
      </div>
    </article>
  )
}
