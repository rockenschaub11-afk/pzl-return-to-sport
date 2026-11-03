// Arztbericht (aus pages/Bericht.tsx, Audit L2) – memo: rendert beim Tippen des Namens nicht neu.

import { memo, useMemo } from 'react'
import type { Testung } from '../db'
import { KATALOG } from '../katalog'
import { MELOQ } from '../katalog/meloq'
import type { Patient } from '../patienten/stammdaten'
import { einheitFest } from '../testung/erfassung'
import LinienDiagramm from '../testung/LinienDiagramm'
import type { useMeloqAuswahl } from '../testung/meloqAuswahl'
import { NORMDATEN } from '../testung/normdaten'
import { verfuegbareOptionen } from '../testung/verlauf'
import { verlaufsDiagramme } from '../testung/verlaufDiagramme'
import { arztBericht, patBericht, verlaufTabelle, type ArztBericht, type PatBericht, type VerlaufTabelle } from './bericht'
import LsiUebersicht from './LsiUebersicht'
import { lsiUebersicht } from './lsiZeilen'
import type { RohTest } from './nachvollziehbarkeit'
import OdsVergleich, { OdsHinweis } from './OdsVergleich'
import { odsFuerTestung } from './odsZeilen'

import { Abschnitt, bisZu, BewertungMarke, Fuss, Kopf, Tafel, waehleOption, Zaehlung, type KontextEintrag, type SymbolName } from './teile'

const KONTEXT_ARZT: [string, SymbolName][] = [
  ['Zeit bis zur Testung', 'zeit'],
  ['Betroffene Seite', 'seite'],
  ['Graft', 'graft'],
]
const STAMM_BREIT = ['Tegner vor Verletzung', 'Tegner aktuell', 'Begleit-OP', 'Phase']

// ---------- Arztbericht ----------

function ArztAnsicht({
  patient,
  testung,
  alle,
  verlaufWahl,
  meloqAuswahl,
}: {
  patient: Patient
  testung: Testung
  alle: Testung[]
  verlaufWahl: string
  meloqAuswahl: ReturnType<typeof useMeloqAuswahl>
}) {
  const b: ArztBericht = useMemo(() => arztBericht(patient, testung, meloqAuswahl), [patient, testung, meloqAuswahl])
  const pat: PatBericht = useMemo(() => patBericht(patient, testung, alle), [patient, testung, alle])
  const lsi = useMemo(() => lsiUebersicht(b, pat), [b, pat])
  const ods = useMemo(() => odsFuerTestung(patient, testung), [patient, testung])
  const bis = useMemo(() => bisZu(alle, testung), [alle, testung])
  const tabelle = useMemo(() => verlaufTabelle(patient, bis, testung), [patient, bis, testung])
  // Quellen als Fußnoten statt eigener Spalte (Bericht-Audit Punkt 12): Nummer in Reihenfolge des ersten Auftretens
  const quellen = [...new Set(b.bloecke.flatMap((x) => x.tests.flatMap((t) => (t.gemessen ? t.kriterien.map((k) => k.quelle) : []))).filter((q) => q && q !== '–'))]
  const quelleNr = (q: string) => (quellen.includes(q) ? quellen.indexOf(q) + 1 : null)

  const stamm = Object.fromEntries(b.stammdaten)
  const kontext: KontextEintrag[] = [
    ['Datum der Testung', b.datum, 'datum'],
    ['Phase', b.phase.name, 'phase'],
    ...KONTEXT_ARZT.filter(([k]) => stamm[k]).map(([k, s]): KontextEintrag => [k, stamm[k], s]),
  ]
  const imKopf = kontext.map(([k]) => k)
  // Nummern laufen mit, auch wenn die LSI-Übersicht fehlt
  const nrLsi = lsi.length > 0 ? 2 : null
  const nrStamm = nrLsi ? 3 : 2
  const nrErgebnisse = nrStamm + 1
  const nrVerlauf = nrErgebnisse + 1
  const nrUnterschrift = nrVerlauf + 1

  return (
    <article className="bericht bericht-arzt" aria-label="Arztbericht">
      <Kopf titel="Arztbericht Return-to-Sport" kuerzel={b.kuerzel} unter={`${b.artText} nach VKB-Verletzung`} entwurf={b.entwurf} kontext={kontext} />

      {!b.rts && (
        <Abschnitt nr={1} titel={b.stand.titel} notiz="Verlaufstest – Ziele der Phase nach Read, kein RTS-Vorschlag.">
          <div className="bericht-tafel bericht-beurteilung">
            <div className="bericht-stand">
              <div>
                <Zaehlung text={b.stand.zeile.split(' · ')[0]} />
                {b.stand.zeile.includes(' · ') && <span className="bericht-leise">{b.stand.zeile.split(' · ').slice(1).join(' · ')}</span>}
              </div>
            </div>
          </div>
          {(b.stand.offen.length > 0 || b.stand.nichtGemessen.length > 0) && (
            <div className="bericht-fehlt">
              {b.stand.offen.length > 0 && (
                <Tafel titel="Nicht erfüllt" symbol="liste">
                  <ul>
                    {b.stand.offen.map((w) => (
                      <li key={w}>{einheitFest(w)}</li>
                    ))}
                  </ul>
                </Tafel>
              )}
              {b.stand.nichtGemessen.length > 0 && (
                <Tafel className="bericht-leise">
                  <p>Nicht gemessen: {b.stand.nichtGemessen.join(', ')}</p>
                </Tafel>
              )}
            </div>
          )}
          {b.stand.aclRsiWarnung && <p className="bericht-warnung">⚠ {b.stand.aclRsiWarnung}</p>}
        </Abschnitt>
      )}

      {b.rts && (
        <Abschnitt nr={1} titel="RTS-Vorschlag und Entscheidung" notiz={`Grau hinterlegt = Einschätzung. Messwerte ab Abschnitt ${nrLsi ?? nrErgebnisse}.`}>
          <div className="bericht-tafel bericht-beurteilung">
            <div className="bericht-stand bericht-stand-drei">
              <div>
                <Zaehlung text={b.stand.zeile.split(' · ')[0]} />
                {b.stand.zeile.includes(' · ') && <span className="bericht-leise">{b.stand.zeile.split(' · ').slice(1).join(' · ')}</span>}
              </div>
              <div>
                <span className="bericht-label">Vorschlag der App</span>
                <strong>{b.rts.vorschlag}</strong>
              </div>
              <div>
                <span className="bericht-label">Beurteilung der Therapeut:in</span>
                {b.rts.entscheidung ? (
                  <>
                    <strong>{b.rts.entscheidung.ergebnis}</strong>
                    <span>{b.rts.entscheidung.text}</span>
                    {b.rts.entscheidung.begruendung && <span>Begründung: {b.rts.entscheidung.begruendung}</span>}
                  </>
                ) : (
                  <span className="bericht-offen">noch offen (Testung nicht abgeschlossen)</span>
                )}
              </div>
            </div>
          </div>
          {(b.rts.wasFehlt.length > 0 || b.rts.wuenschenswert.length > 0) && (
            <div className="bericht-fehlt">
              {b.rts.wasFehlt.length > 0 && (
                <Tafel titel="Was fehlt noch?" symbol="liste">
                  <ul>
                    {b.rts.wasFehlt.map((w) => (
                      <li key={w}>{einheitFest(w)}</li>
                    ))}
                  </ul>
                </Tafel>
              )}
              {b.rts.wuenschenswert.length > 0 && (
                <Tafel titel="Wünschenswert, nicht erreicht (blockiert nicht)" symbol="kreis" className="bericht-leise">
                  <ul>
                    {b.rts.wuenschenswert.map((w) => (
                      <li key={w}>{einheitFest(w)}</li>
                    ))}
                  </ul>
                </Tafel>
              )}
            </div>
          )}
          {b.rts.hinweise.length > 0 && (
            <ul className="bericht-hinweise bericht-leise">
              {b.rts.hinweise.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          {b.rts.aclRsiWarnung && <p className="bericht-warnung">⚠ {b.rts.aclRsiWarnung} – blockiert den Vorschlag nicht.</p>}
          <p className="bericht-hinweis-stark">Ersetzt keine ärztliche Freigabe.</p>
        </Abschnitt>
      )}

      {nrLsi && (
        <Abschnitt
          nr={nrLsi}
          titel="Seitenvergleich auf einen Blick"
          notiz={`LSI = betroffen / gesund × 100 (6 m Hop umgekehrt). Ohne LSI: Klinik, CMJ-Asymmetrie, IMTP, Fragebögen – siehe ${nrErgebnisse}.`}
        >
          <div className="bericht-tafel bericht-tafel-innen">
            <LsiUebersicht zeilen={lsi} vorigeDatum={pat.vorigeDatum} />
          </div>
          {ods.map((v) => (
            <div key={v.test} className="bericht-tafel bericht-tafel-innen ods-block">
              <h3 className="ods-titel">{v.name}: Ergebnis, Antrieb, Strategie</h3>
              <OdsVergleich vergleich={v} />
            </div>
          ))}
          {ods.length > 0 && <OdsHinweis />}
        </Abschnitt>
      )}

      <Abschnitt nr={nrStamm} titel="Stammdaten">
        <dl className="bericht-stamm">
          {/* was schon in der Kontextleiste im Kopf steht, nicht wiederholen */}
          {/* breite Felder (Tegner, Begleit-OP) ans Ende, damit die Zeilen voll werden */}
          {[...b.stammdaten.filter(([k]) => !imKopf.includes(k) && !STAMM_BREIT.includes(k)), ...b.stammdaten.filter(([k]) => !imKopf.includes(k) && STAMM_BREIT.includes(k))].map(([k, v]) => (
            <div key={k} className={STAMM_BREIT.includes(k) ? 'bericht-breit' : undefined}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          {b.phase.uebersteuert !== null && (
            <div className="bericht-breit">
              <dt>Phase</dt>
              <dd>
                {b.phase.name}
                <strong className="bericht-markiert"> – übersteuert: {b.phase.uebersteuert}</strong>
              </dd>
            </div>
          )}
        </dl>
      </Abschnitt>

      <Abschnitt
        nr={nrErgebnisse}
        titel="Ergebnisse"
        className="bericht-lang bericht-neue-seite"
        notiz={`Bewertet mit den Schwellen der Phase ${b.phase.name}. LSI = betroffen / gesund × 100 (Zeit-Tests umgekehrt). Ampel: ✓ erfüllt · ~ knapp (LSI ab ${KATALOG.regeln.lsi.gelbAb} % und unter ${KATALOG.regeln.lsi.gruenAb} %, ${KATALOG.regeln.lsi.quelle}) · ✗ nicht erfüllt. Ohne Zusatz = Pflicht.`}
      >
        <div className="bericht-tafel bericht-tafel-lang">
          <table className="bericht-tabelle bericht-ergebnis">
            <colgroup>
              <col style={{ width: '36%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Test / Kriterium</th>
                <th scope="col" className="bericht-zahl">gesund</th>
                <th scope="col" className="bericht-zahl">betroffen</th>
                <th scope="col" className="bericht-zahl">Wert</th>
                <th scope="col" className="bericht-zahl">Ziel</th>
                <th scope="col">Bewertung</th>
              </tr>
            </thead>
            {b.bloecke.map((block) => (
              <tbody key={block.block}>
                <tr className="bericht-block-zeile">
                  <th colSpan={SPALTEN}>{block.name}</th>
                </tr>
                {block.tests.map((t) => (
                  <ArztTestZeilen key={t.test.id} t={t} quelleNr={quelleNr} />
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <p className="bericht-leise bericht-klein">
          Meloq-Werte vom gewerteten Versuch (größte Sprunghöhe); O = Output, D = Driver, S = Strategy – ohne Ampel. {MELOQ.nichtMessbar}
        </p>
        {quellen.length > 0 && (
          <>
            <h3 className="bericht-unterkopf">Quellen der Ziele</h3>
            <ol className="bericht-quellen">
              {quellen.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </>
        )}
      </Abschnitt>

      <VerlaufAbschnitt nr={nrVerlauf} patient={patient} testungen={bis} tabelle={tabelle} wahl={verlaufWahl} />

      <Abschnitt nr={nrUnterschrift} titel="Bestätigung" className="bericht-unterschrift-abschnitt">
        <div className="bericht-unterschrift">
          <div>
            <span className="bericht-linie" />
            <span>Ort, Datum</span>
          </div>
          <div>
            <span className="bericht-linie" />
            <span>Unterschrift Therapeut:in{b.therapeut && ` (${b.therapeut})`}</span>
          </div>
        </div>
        {b.abgeschlossenAm && <p className="bericht-leise">Testung abgeschlossen am {b.abgeschlossenAm}.</p>}
      </Abschnitt>

      <Methodik protokolle={b.protokolle} endtestung={b.rts !== null} />
      <RohdatenAnhang rohdaten={b.rohdaten} />
      <Fuss />
    </article>
  )
}

// ---------- Anhang (Bericht-Audit Punkte 8 und 9) ----------

const QUELLEN = [
  'Read P. Practitioner’s Guide to ACL. VALD, 2024 (Seitenangaben „Read S. …“; Schwellen je Phase S. 59).',
  'Aspetar ACL Rehabilitation Protocol.',
  'ACL Injuries Part 2 Handbook (Clinical Physio).',
  'VALD Research Normative Data Report – ACL.',
  'Hawkin Dynamics, ODS System; McMahon et al., Strength Cond J 2021 (Output / Driver / Strategy).',
]

function Methodik({ protokolle, endtestung }: { protokolle: ArztBericht['protokolle']; endtestung: boolean }) {
  const r = KATALOG.regeln
  return (
    <Abschnitt nr="A" titel="Anhang: Methodik und Definitionen" className="bericht-lang bericht-anhang">
      <dl className="bericht-methodik">
        <dt>Ablauf</dt>
        <dd>
          <ul>
            {protokolle.map((p) => (
              <li key={p.name}>
                <strong>{p.name}:</strong> {p.ablauf} <span className="bericht-quelle">({p.quelle})</span>
              </li>
            ))}
          </ul>
          Tatsächlicher Winkel, Boxhöhe, Eingabe-Einheit und Hebelarm stehen beim jeweiligen Test („Protokoll“).
        </dd>
        <dt>Gewerteter Versuch</dt>
        <dd>
          Bestwert aus bis zu {r.versucheJeSeite} Versuchen je Seite (6 m Hop: schnellster). Kraftmessplatte: der Versuch mit der größten Sprunghöhe zählt mit allen
          seinen Werten.
        </dd>
        <dt>LSI</dt>
        <dd>
          betroffen / gesund × 100 (6 m Hop: gesund / betroffen × 100). Bewertung: ✓ ab {r.lsi.gruenAb} %, ~ {r.lsi.gelbAb}–unter {r.lsi.gruenAb} %, ✗ unter {r.lsi.gelbAb} % ({r.lsi.quelle}).
        </dd>
        <dt>Asymmetrie</dt>
        <dd>
          wie Meloq: (stärker − schwächer) / stärker × 100. Die Formel kennt keine Richtung, darum steht beim Wert, welche Seite schwächer ist. Sie ist nicht dasselbe
          wie 100 − LSI.
        </dd>
        <dt>Relative Werte</dt>
        <dd>
          N/kg = Kraft in kg × {r.erdbeschleunigung.toLocaleString('de-AT')} / Körpergewicht · Ns/kg = Impuls in kg·s × {r.erdbeschleunigung.toLocaleString('de-AT')} / Körpergewicht · Nm/kg = Kraft in N × Hebelarm in m / Körpergewicht.
        </dd>
        <dt>Rundung</dt>
        <dd>Bewertet wird die angezeigte, gerundete Zahl (89,96 % → 90,0 % → ✓).</dd>
        <dt>Streuung</dt>
        <dd>
          Variationskoeffizient (CV) = Standardabweichung der Versuche / Mittelwert × 100, ab 2 Versuchen. Über {r.variationskoeffizientWarnungUeber} % (
          {r.variationskoeffizientQuelle}) ist der Wert mit Vorsicht zu interpretieren.
        </dd>
        <dt>Schwellen</dt>
        <dd>
          Je Phase nach Read (S. 59); eine Phase ohne eigenen Wert übernimmt den der Phase davor. Read-Bereiche sind 95-%-Konfidenzintervalle, teils aus
          unveröffentlichten Daten, „for guidance only“ und nicht nach Geschlecht getrennt (Schwelle = untere bzw. obere Grenze). {r.frauenHinweis}
        </dd>
        <dt>Sprunghöhe</dt>
        <dd>Meloq berechnet sie aus der Flugzeit, VALD (Read-Referenz) aus dem Impuls – Abweichungen sind möglich. {MELOQ.nichtMessbar}</dd>
        <dt>Vergleichswerte</dt>
        <dd>
          LSI zur Vorverletzung: betroffen im Verhältnis zum eingetragenen Wert vor der Verletzung, ohne Ampel. Normdaten „typisch nach VKB-OP“ (VALD Research
          Normative Data Report, Mittelwert ± 1 SD) stehen nur, wenn Geschlecht, Altersband und Zeitpunkt (6 / 9 / 12 Monate, ± {NORMDATEN.toleranzMonate.toLocaleString('de-AT')}{' '}
          Monate) genau passen – ohne Einfluss auf die Bewertung.
        </dd>
        {endtestung && (
          <>
            <dt>RTS-Vorschlag</dt>
            <dd>
              „Kriterien erfüllt“ nur, wenn alle Pflicht-Kriterien ✓ sind und mindestens {r.rts.mindestMonate} Monate seit der OP vergangen sind ({r.rts.quelle}).
              Die Therapeut:in bestätigt oder überstimmt mit Begründung. Ersetzt keine ärztliche Freigabe.
            </dd>
          </>
        )}
        <dt>Quellen</dt>
        <dd>
          <ul>
            {QUELLEN.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </dd>
      </dl>
    </Abschnitt>
  )
}

const zahlRoh = (v: number | null, einheit: string) => (v === null ? '–' : v.toLocaleString('de-AT', { maximumFractionDigits: einheit === 's' ? 2 : 1 }))

function RohdatenAnhang({ rohdaten }: { rohdaten: RohTest[] }) {
  if (rohdaten.length === 0) return null
  return (
    <Abschnitt nr="B" titel="Anhang: Rohdaten" className="bericht-lang" notiz={`Fett = gewerteter Versuch. CV mit „!“ = über ${KATALOG.regeln.variationskoeffizientWarnungUeber} % (${KATALOG.regeln.variationskoeffizientQuelle}) – Wert mit Vorsicht interpretieren.`}>
      <div className="bericht-tafel bericht-tafel-lang">
        <table className="bericht-tabelle bericht-roh">
          <thead>
            <tr>
              <th scope="col">Test</th>
              <th scope="col">Seite</th>
              <th scope="col" className="bericht-zahl">Versuch 1</th>
              <th scope="col" className="bericht-zahl">Versuch 2</th>
              <th scope="col" className="bericht-zahl">Versuch 3</th>
              <th scope="col" className="bericht-zahl">CV</th>
            </tr>
          </thead>
          <tbody>
            {rohdaten.flatMap((t) =>
              t.zeilen.map((z, zi) => (
                <tr key={`${t.id}-${z.seite}`}>
                  {zi === 0 && (
                    <td rowSpan={t.zeilen.length} className="bericht-roh-test">
                      {t.name}
                      <span className="bericht-protokoll">
                        {t.einheit} · gewertet: {t.gewertet}
                      </span>
                    </td>
                  )}
                  <td className="bericht-roh-seite">{z.seite}</td>
                  {z.werte.map((w, i) => (
                    <td key={i} className="bericht-zahl">
                      {i === z.gewertet ? <strong>{zahlRoh(w, t.einheit)}</strong> : zahlRoh(w, t.einheit)}
                    </td>
                  ))}
                  <td className="bericht-zahl">
                    {z.cv === null ? '–' : z.cvHoch ? <strong>{`${z.cv.toLocaleString('de-AT', { maximumFractionDigits: 1 })} % !`}</strong> : `${z.cv.toLocaleString('de-AT', { maximumFractionDigits: 1 })} %`}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </Abschnitt>
  )
}

const ODS_KURZ = { output: 'O', driver: 'D', strategy: 'S' } as const
/** Spalten der Ergebnistabelle: Test/Kriterium | gesund | betroffen | Wert | Ziel | Bewertung – Quelle als Fußnote beim Ziel (Bericht-Audit Punkt 12) */
const SPALTEN = 6

function ArztTestZeilen({ t, quelleNr }: { t: ArztBericht['bloecke'][number]['tests'][number]; quelleNr: (q: string) => number | null }) {
  if (!t.gemessen) {
    return (
      <tr className="bericht-test-zeile">
        <th scope="row">{t.test.name}</th>
        <td colSpan={SPALTEN - 1} className="bericht-leise">
          nicht gemessen
        </td>
      </tr>
    )
  }
  const sp = t.seitenSpalten
  return (
    <>
      <tr className="bericht-test-zeile">
        <th scope="row">
          {t.test.name}
          {t.ausserhalbTestset && <span className="bericht-tag"> (nicht im Testset der Phase)</span>}
          {t.protokoll.length > 0 && (
            <span className="bericht-protokoll">
              Protokoll:{' '}
              {t.protokoll.map((p, i) => (
                <span key={p.text}>
                  {i > 0 && ' · '}
                  {p.abweichend ? <strong>{p.text}</strong> : p.text}
                </span>
              ))}
            </span>
          )}
        </th>
        <td className="bericht-zahl bericht-gesund">
          {sp?.gesund}
          {sp?.gesundEingabe && <span className="bericht-eingabe">{sp.gesundEingabe}</span>}
        </td>
        <td className="bericht-zahl bericht-betroffen">
          {sp?.betroffen}
          {sp?.betroffenEingabe && <span className="bericht-eingabe">{sp.betroffenEingabe}</span>}
        </td>
        <td colSpan={3} />
      </tr>
      {t.kriterien.map((k) => (
        <tr key={k.bezeichnung} className="bericht-krit">
          <td colSpan={3}>
            {k.bezeichnung}
            {k.status !== 'Pflicht' && <span className="bericht-tag">{k.status}</span>}
          </td>
          <td className="bericht-zahl">
            {k.wert}
            {k.wertHinweis && <span className="bericht-eingabe">{k.wertHinweis}</span>}
          </td>
          <td className="bericht-zahl">
            {k.ziel}
            {quelleNr(k.quelle) !== null && <sup className="bericht-fussnote">{quelleNr(k.quelle)}</sup>}
          </td>
          <td className="bericht-bewertung">
            <BewertungMarke b={k.bewertung} />
          </td>
        </tr>
      ))}
      {t.meloq.length > 0 && (
        <tr className="bericht-meloq-kopf">
          <td colSpan={SPALTEN}>Meloq-Werte (gewerteter Versuch) – ohne Ampel</td>
        </tr>
      )}
      {t.meloq.map((m) => (
        <tr key={m.name} className="bericht-meloq">
          <td>
            <span className="bericht-ods">{ODS_KURZ[m.ods]}</span> {m.name}
          </td>
          <td colSpan={3} className="bericht-meloq-wert">
            {m.wert}
          </td>
          <td colSpan={2}>{m.vergleich || '–'}</td>
        </tr>
      ))}
      {t.normdaten && (
        <tr className="bericht-unterzeile bericht-normdaten">
          <td colSpan={SPALTEN}>{t.normdaten}</td>
        </tr>
      )}
      {t.klinischAnders && (
        <tr className="bericht-markiert-zeile">
          <td colSpan={SPALTEN}>
            <strong>Klinisch anders beurteilt:</strong> {t.klinischAnders.urteil} – {t.klinischAnders.begruendung}
          </td>
        </tr>
      )}
      {t.zusatz.length > 0 && (
        <tr className="bericht-unterzeile">
          <td colSpan={SPALTEN}>{t.zusatz.join(' · ')}</td>
        </tr>
      )}
    </>
  )
}

/** Zellwert „83,3 % ~“: Zahl fett, Zeichen in Ampelfarbe – gleicher Text. */
const ZEICHEN_AMPEL: Record<string, string> = { '✓': 'gruen', '~': 'gelb', '✗': 'rot' }
function VerlaufWert({ wert }: { wert: string }) {
  const m = /^(.*) ([✓~✗])$/.exec(wert)
  if (!m) return <span className={wert === '–' ? 'bericht-leise' : undefined}>{wert}</span>
  return (
    <>
      <strong>{m[1]}</strong> <span className={`bericht-zeichen ampel-${ZEICHEN_AMPEL[m[2]]}`}>{m[2]}</span>
    </>
  )
}

function VerlaufAbschnitt({ nr, patient, testungen, tabelle, wahl }: { nr: number; patient: Patient; testungen: Testung[]; tabelle: VerlaufTabelle; wahl: string }) {
  const optionen = verfuegbareOptionen(patient, testungen)
  const option = optionen.length > 0 ? waehleOption(optionen, wahl) : undefined
  const v = option ? verlaufsDiagramme(patient, testungen, option) : null
  const mitVeraenderung = tabelle.spalten.length >= 2

  return (
    <Abschnitt
      nr={nr}
      titel="Verlauf"
      className="bericht-lang bericht-verlauf"
      notiz={
        tabelle.zeilen.length > 0
          ? `✓ ~ ✗ jeweils nach dem Ziel der Phase dieser Testung – ändert sich das Ziel, steht es unter dem Wert.${mitVeraenderung ? ' Veränderung: rohe Differenz der angezeigten Werte zur vorigen Testung mit Wert (Pkt. = Prozentpunkte), ohne Angabe zum Messfehler.' : ''}`
          : undefined
      }
    >
      {tabelle.spalten.length < 2 && <p className="bericht-leise">Bisher nur diese Testung – noch kein Verlauf.</p>}
      {tabelle.zeilen.length > 0 && (
        <div className="bericht-tafel bericht-tafel-lang">
          <table className="bericht-tabelle bericht-verlauf-tabelle">
            <thead>
              <tr>
                <th scope="col">
                  Pflicht-Test<small>Kriterium</small>
                </th>
                {tabelle.spalten.map((s, i) => (
                  <th key={i} className="bericht-zahl">
                    {s.datum}
                    <small>{s.phase}</small>
                  </th>
                ))}
                {mitVeraenderung && (
                  <th scope="col" className="bericht-zahl">
                    Veränderung<small>zur vorigen Testung</small>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tabelle.zeilen.map((z) => (
                <tr key={z.name}>
                  <td>
                    <strong>{z.name}</strong>
                    {z.kriterium && <span className="bericht-eingabe bericht-links">{z.kriterium}</span>}
                  </td>
                  {z.werte.map((w, i) => (
                    <td key={i} className="bericht-zahl">
                      <VerlaufWert wert={w.wert} />
                      {w.seiten && <span className="bericht-eingabe">{w.seiten}</span>}
                      {w.ziel && <span className="bericht-eingabe">Ziel {w.ziel}</span>}
                    </td>
                  ))}
                  {mitVeraenderung && (
                    <td className="bericht-zahl bericht-veraenderung">
                      {z.veraenderung ? (
                        <>
                          <strong>{z.veraenderung.split(' · ')[0]}</strong>
                          {z.veraenderung.includes(' · ') && <span className="bericht-eingabe">{z.veraenderung.split(' · ').slice(1).join(' · ')}</span>}
                        </>
                      ) : (
                        '–'
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tabelle.zeilen.length > 0 && <p className="bericht-leise bericht-klein">b = betroffen, g = gesund (Kraft in N/kg).</p>}
      {v && v.punkte.length > 1 && (
        <div className="bericht-diagramme">
          {v.diagramme.map((d) => (
            <div key={d.titel} className="bericht-tafel bericht-tafel-innen">
              <LinienDiagramm {...d} />
            </div>
          ))}
        </div>
      )}
    </Abschnitt>
  )
}

// ---------- Pat./Trainer-Bericht ----------

/** Gruppen der Werte-Liste in Alltagssprache; IMTP (Kraftmessplatte) zählt zur Kraft. */

export default memo(ArztAnsicht)
