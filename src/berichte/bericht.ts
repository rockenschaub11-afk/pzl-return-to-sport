// Inhalte von Arztbericht und Pat./Trainer-Bericht (docs/ENTSCHEIDUNGEN.md 10; Etappe-9-Fragen).
// Nur Daten aus der Testung – der Name der Pat. kommt hier nie vor: er wird nur in der Druckansicht eingesetzt und nie gespeichert (F9).
// Formulierung nie „Freigabe“ (F36).

import type { Testung } from '../db'
import { KATALOG, phaseNach, protokollNach } from '../katalog'
import { BLOCK_NAMEN, BLOECKE, STATUS_NAMEN, type Block, type TestDef } from '../katalog/typen'
import { istMeloqTest } from '../katalog/meloq'
import {
  BEGLEIT_OPS,
  datumDeutsch,
  GESCHLECHTER,
  GRAFTS,
  NIVEAUS,
  TEGNER_STUFEN,
  type Patient,
} from '../patienten/stammdaten'
import type { Ampel, KriteriumErgebnis } from '../rechnen/bewertung'
import { ART_TEXT, monateBisTestung, phasenStand, sichtbareTests, werteAus, type TestAuswertung } from '../testung/ablauf'
import { endErgebnis, ENTSCHEIDUNG_TEXT } from '../testung/ErgebnisEntscheidung'
import { ERFASSUNG, hatEingabe, HQ_HINWEIS, hqQuotient, KOOS_SUBSKALEN, parseZahl, type TestEingabe } from '../testung/erfassung'
import { AMPEL_TEXT } from '../testung/Ladebalken'
import { kernStrategie, zusatzZeilen, type MeloqZeile } from '../testung/meloq'
import type { MeloqAuswahl } from '../testung/meloqAuswahl'
import type { NetzAchse } from './Spinnennetz'
import { alsNewton, nProKg } from '../rechnen/einheiten'
import {
  impulsRichtung,
  nachSeite,
  protokollTeile,
  boxTatsaechlich,
  richtung,
  RICHTUNG_ARZT,
  RICHTUNG_PAT,
  rohdaten,
  streuungHinweis,
  type ProtokollTeil,
  type RohTest,
} from './nachvollziehbarkeit'
import { normdatenFuer } from '../testung/normdaten'
import { pflichtStatus, pflichtVerfehlt, RTS_TEXT, rtsVorschlag, wertText, zielText, type RtsVorschlag } from '../testung/rts'

/** Ampel-Zeichen – damit die Bewertung auch in Schwarz-Weiß lesbar bleibt (10a, D6). */
export const AMPEL_ZEICHEN: Record<Ampel, string> = { gruen: '✓', gelb: '~', rot: '✗' }

const zahl = (v: number | null | undefined, nachkomma = 1) =>
  v === null || v === undefined ? '–' : v.toLocaleString('de-AT', { maximumFractionDigits: nachkomma })

const mitEinheit = (v: number | null | undefined, einheit: string) => {
  if (v === null || v === undefined) return '–'
  const text = zahl(v, einheit === 's' ? 2 : 1)
  return einheit === '%' ? `${text} %` : einheit ? `${text} ${einheit}` : text
}

// ---------- gemeinsame Bausteine ----------

/** Kriterien, die das Körpergewicht brauchen – ohne Gewicht bleiben sie offen, obwohl gemessen wurde (Bericht-Audit Punkt 10). */
const GEWICHT_EINHEITEN = ['N/kg', 'Ns/kg']
const ohneGewicht = (e: KriteriumErgebnis, kg: number | null) => e.zustand === 'offen' && kg === null && GEWICHT_EINHEITEN.includes(e.kriterium.einheit ?? '')

/** Gemessener Test, bei dem ein Kriterium nur wegen des fehlenden Körpergewichts offen ist. */
function wartetAufGewicht(testung: Testung, a: TestAuswertung | undefined): boolean {
  const kg = parseZahl(testung.koerpergewichtKg)
  return !!a && hatEingabe(testung.eingaben[a.ergebnis.test.id]) && a.ergebnis.kriterien.some((e) => ohneGewicht(e, kg))
}

export interface Bewertung {
  ampel: Ampel | null
  text: string
}

/** Bewertung eines Kriteriums als Text (immer mit Wort, nicht nur Farbe). */
export function bewertungText(e: KriteriumErgebnis): Bewertung {
  if (e.zustand === 'offen') return { ampel: null, text: 'nicht gemessen' }
  if (e.zustand === 'info' || !e.ampel) return { ampel: null, text: 'Info (ohne Ampel)' }
  if (e.kriterium.status === 'warnung') return e.ampel === 'gruen' ? { ampel: 'gruen', text: 'erfüllt' } : { ampel: 'gelb', text: 'Warnung' }
  if (!e.zaehlt && e.kriterium.frauenWuenschenswert && e.ampel !== 'gruen') return { ampel: e.ampel, text: 'nicht erreicht (Frauen-Regel, blockiert nicht)' }
  return { ampel: e.ampel, text: AMPEL_TEXT[e.ampel] }
}

/** Phase der Testung als Text, mit Markierung „übersteuert“. */
function phaseText(testung: Testung, patient: Patient) {
  const ph = phasenStand(testung, patient.opDatum)
  const u = testung.phaseUebersteuert
  return {
    ph,
    name: phaseNach(ph.phase).lang,
    kurz: phaseNach(ph.phase).name,
    uebersteuert: ph.uebersteuert && u ? u.begruendung.trim() : null,
  }
}

/** Vorschlag zum Zeitpunkt des Abschlusses (falls gespeichert), sonst der aktuelle. */
function vorschlagErfuellt(testung: Testung, v: RtsVorschlag): boolean {
  const e = testung.entscheidung
  return testung.status === 'abgeschlossen' && e?.vorschlagBeiAbschluss ? e.vorschlagBeiAbschluss === 'erfuellt' : v.erfuellt
}

// ---------- Arztbericht ----------

export interface ArztKriterium {
  bezeichnung: string
  status: string
  wert: string
  /** leise unter dem Wert, z. B. „betroffene Seite schwächer“ (Audit Punkt 6) */
  wertHinweis: string | null
  ziel: string
  bewertung: Bewertung
  quelle: string
}

export interface ArztTest {
  test: TestDef
  gemessen: boolean
  /** Bestwerte gesund/betroffen, z. B. „gesund 8,3 · betroffen 7,8 N/kg (66 / 62 kg)“ */
  seiten: string | null
  /** dieselben Bestwerte für die Spalten gesund | betroffen; Eingabe (z. B. „66 kg“) nur bei Krafttests in N/kg */
  seitenSpalten: { gesund: string; betroffen: string; gesundEingabe: string | null; betroffenEingabe: string | null } | null
  /** Winkel, Box, Eingabe-Einheit, Hebelarm (Audit Punkt 5) */
  protokoll: ProtokollTeil[]
  /** „Typisch nach VKB-OP …“ – nur bei genau passender Gruppe, ohne Einfluss auf die Ampel (Audit Punkt 11) */
  normdaten: string | null
  kriterien: ArztKriterium[]
  /** Kern-Satz-Strategy und gewählte Meloq-Zusatzmetriken mit Wert (ohne Ampel) */
  meloq: { ods: MeloqZeile['ods']; name: string; wert: string; vergleich: string }[]
  klinischAnders: { urteil: string; begruendung: string } | null
  zusatz: string[]
  ausserhalbTestset: boolean
}

export interface ArztBericht {
  kuerzel: string
  datum: string
  artText: string
  entwurf: boolean
  phase: { name: string; uebersteuert: string | null }
  stammdaten: [string, string][]
  rts: {
    vorschlag: string
    erfuellt: boolean
    wasFehlt: string[]
    wuenschenswert: string[]
    aclRsiWarnung: string | null
    hinweise: string[]
    entscheidung: { text: string; ergebnis: string; begruendung: string } | null
  } | null
  /** Überblick über die Pflicht-Tests – bei Verlaufstests eigener Kasten, bei der Endtestung Zählzeile im RTS-Kasten (Audit Punkt 7) */
  stand: PflichtStand
  bloecke: { block: Block; name: string; tests: ArztTest[] }[]
  therapeut: string
  abgeschlossenAm: string | null
  /** Anhang: Ablauf der Protokolle der gemessenen Tests (Audit Punkt 8) */
  protokolle: { name: string; ablauf: string; quelle: string }[]
  /** Anhang: Einzelversuche mit Streuung (Audit Punkt 9) */
  rohdaten: RohTest[]
}

export interface PflichtStand {
  titel: string
  /** z. B. „7 von 11 Pflicht-Tests erfüllt · 3 nicht erfüllt · 1 nicht gemessen“ */
  zeile: string
  /** nicht erfüllte Pflicht-Tests mit Wert und Ziel */
  offen: string[]
  nichtGemessen: string[]
  aclRsiWarnung: string | null
}

/** Pflicht-Tests der Testung gezählt wie beim RTS-Vorschlag (nur grün zählt, klinisch anders beurteilt mit Begründung). */
function pflichtStand(v: RtsVorschlag, testung: Testung, auswertung: Map<string, TestAuswertung>, phaseKurz: string): PflichtStand {
  const p = v.pflicht
  const erfuellt = p.filter((x) => x.status === 'erfuellt').length
  const nicht = p.filter((x) => x.status === 'nicht_erfuellt')
  const fehlt = p.filter((x) => x.status === 'fehlt')
  const teile = [`${erfuellt} von ${p.length} Pflicht-Tests erfüllt`]
  if (nicht.length > 0) teile.push(`${nicht.length} nicht erfüllt`)
  if (fehlt.length > 0) teile.push(`${fehlt.length} nicht gemessen`)
  return {
    titel: `Stand der Phase ${phaseKurz}`,
    zeile: p.length === 0 ? 'In dieser Testung gibt es keine Pflicht-Tests.' : teile.join(' · '),
    offen: nicht.map((x) => (x.klinischAnders ? `${x.test.name}: klinisch als nicht erfüllt beurteilt – ${x.klinischAnders.begruendung}` : `${x.test.name}: ${x.gruende.join('; ')}`)),
    nichtGemessen: fehlt.map((x) => (wartetAufGewicht(testung, auswertung.get(x.test.id)) ? `${x.test.name} (Körpergewicht fehlt)` : x.test.name)),
    aclRsiWarnung: v.aclRsiWarnung,
  }
}

function stammdaten(p: Patient, t: Testung): [string, string][] {
  const z: [string, string | false][] = [
    ['Betroffene Seite', p.seite === 'links' ? 'links' : p.seite === 'rechts' ? 'rechts' : '–'],
    [p.konservativ ? 'Verletzungsdatum (konservativ)' : 'OP-Datum', datumDeutsch(p.opDatum)],
    ['Zeit bis zur Testung', `${monateBisTestung(p.opDatum, t.datum) ?? '–'} Monate`],
    ['Niveau', p.niveau ? NIVEAUS[p.niveau] : '–'],
    ['Geschlecht', !!p.geschlecht && GESCHLECHTER[p.geschlecht]],
    ['Geburtsjahr', !!p.geburtsjahr && p.geburtsjahr],
    ['Beinlänge', !!p.beinlaengeCm && `${p.beinlaengeCm} cm`],
    ['Graft', !!p.graft && GRAFTS[p.graft]],
    ['Begleit-OP', (p.begleitOps.length > 0 || !!p.begleitOpAndere) && [...p.begleitOps.map((b) => BEGLEIT_OPS[b]), p.begleitOpAndere].filter(Boolean).join(', ')],
    ['Revision', p.revision && 'ja'],
    ['Sportart', !!p.sportart && p.sportart],
    ['Tegner vor Verletzung', p.tegner !== '' && `${p.tegner} – ${TEGNER_STUFEN[Number(p.tegner)] ?? ''}`],
    ['Tegner aktuell', t.tegnerAktuell !== '' && `${t.tegnerAktuell} – ${TEGNER_STUFEN[Number(t.tegnerAktuell)] ?? ''}`],
    ['Körpergewicht', t.koerpergewichtKg ? `${t.koerpergewichtKg} kg` : '–'],
  ]
  return z.filter((x): x is [string, string] => x[1] !== false && x[1] !== '')
}

/**
 * Zeiten (Contraction Time, Kontaktzeit) in Worten statt als LSI – bei Zeiten heißt über 100 % „betroffen länger“,
 * das liest sich als LSI leicht falsch (Bericht-Audit Punkt 14). Gerechnet wird gleich: betroffen / gesund.
 */
export function zeitVergleich(lsiWert: number): string {
  const diff = Math.round((lsiWert - 100) * 10) / 10
  if (diff === 0) return 'betroffen gleich lang'
  return `betroffen ${zahl(Math.abs(diff))} % ${diff > 0 ? 'länger' : 'kürzer'}`
}

function meloqWerte(test: TestDef, testung: Testung, a: TestAuswertung, auswahl: MeloqAuswahl | undefined, seite: Patient['seite']): ArztTest['meloq'] {
  if (!istMeloqTest(test.id)) return []
  const e = testung.eingaben[test.id] ?? {}
  const zeilen = [kernStrategie(test.id, e, a.berechnung), ...(auswahl ? zusatzZeilen(test.id, e, auswahl[test.id], parseZahl(testung.koerpergewichtKg)) : [])]
  // L/R der betroffenen Seite zuordnen (Audit Punkt 6)
  const markiere = (s: 'L' | 'R') => (nachSeite('L', 'R', seite)?.betroffen === s ? `${s} (betroffen)` : s)
  return zeilen
    .filter((z) => z.werte.some((w) => w !== null))
    .map((z) => {
      const nk = z.einheit === 'ms' ? 0 : 1
      const roh =
        z.form === 'eins'
          ? `${zahl(z.werte[0], nk)} ${z.einheit}`
          : `${z.form === 'lr' ? markiere('L') : 'gesund'} ${zahl(z.werte[0], nk)} · ${z.form === 'lr' ? markiere('R') : 'betroffen'} ${zahl(z.werte[1], nk)} ${z.einheit}`
      const rel = z.relativ && z.relativ.werte.some((w) => w !== null) ? ` (${z.relativ.werte.map((w) => zahl(w, z.relativ!.einheit === 'N/s' ? 0 : 1)).join(' / ')} ${z.relativ.einheit})` : ''
      let v = ''
      if (z.vergleich && z.vergleich.wert !== null) {
        if (z.vergleich.art === 'lsi' && z.einheit === 'ms') v = zeitVergleich(z.vergleich.wert)
        else if (z.vergleich.art === 'lsi') v = `LSI ${zahl(z.vergleich.wert)} %`
        else {
          const s = nachSeite(z.werte[0], z.werte[1], seite)
          const r = s ? richtung(s.betroffen, s.gesund) : null
          v = `Asymmetrie ${zahl(z.vergleich.wert)} %${r ? ` – ${RICHTUNG_ARZT[r]}` : ''}`
        }
      }
      return { ods: z.ods, name: z.name, wert: roh + rel, vergleich: v }
    })
}

/** Seitenwerte für Vergleiche: bei Krafttests mit Körpergewicht in N/kg (gerundet wie angezeigt), sonst in der Einheit des Tests. */
/** Hop-Weiten mit Beinlänge (Audit G4) – ohne Normdaten, daher nur Info ohne Bewertung. */
const HOP_WEITE = ['single_hop', 'triple_hop', 'crossover_hop']

export function beinlaengeText(test: TestDef, b: TestAuswertung['berechnung'], patient: Patient): string | null {
  const bein = parseZahl(patient.beinlaengeCm)
  const s = b.seiten
  if (!HOP_WEITE.includes(test.id) || !bein || !s || s.einheit !== 'cm' || (s.gesund === null && s.betroffen === null)) return null
  const pct = (w: number | null) => (w === null ? '–' : `${zahl((w / bein) * 100, 0)} %`)
  return `In % der Beinlänge (${zahl(bein)} cm): gesund ${pct(s.gesund)} · betroffen ${pct(s.betroffen)} – nur Info, ohne Bewertung`
}

function seitenWerte(test: TestDef, b: TestAuswertung['berechnung'], kg: number | null): { gesund: number | null; betroffen: number | null; einheit: string } | null {
  const s = b.seiten
  if (!s || (s.gesund === null && s.betroffen === null)) return null
  if (ERFASSUNG[test.id]?.typ === 'kraft') {
    if (!kg) return null
    const rel = (v: number | null) => (v === null ? null : Math.round(nProKg(alsNewton(v, s.einheit === 'N' ? 'N' : 'kg'), kg) * 10) / 10)
    return { gesund: rel(s.gesund), betroffen: rel(s.betroffen), einheit: 'N/kg' }
  }
  return { gesund: s.gesund, betroffen: s.betroffen, einheit: s.einheit }
}

/** Seitenwerte; bei Krafttests mit Körpergewicht in N/kg, die Eingabe in Klammern (Audit Punkt 22). */
function seitenText(test: TestDef, b: TestAuswertung['berechnung'], kg: number | null): string | null {
  const s = b.seiten
  if (!s || (s.gesund === null && s.betroffen === null)) return null
  const w = seitenWerte(test, b, kg)
  if (w && w.einheit === 'N/kg') {
    return `gesund ${zahl(w.gesund)} · betroffen ${zahl(w.betroffen)} N/kg (${zahl(s.gesund)} / ${zahl(s.betroffen)} ${s.einheit})`
  }
  return `gesund ${mitEinheit(s.gesund, s.einheit)} · betroffen ${mitEinheit(s.betroffen, s.einheit)}`
}

/** Bestwerte als Spalten – gleiche Zahlen wie seitenText. */
function seitenSpalten(test: TestDef, b: TestAuswertung['berechnung'], kg: number | null): ArztTest['seitenSpalten'] {
  const s = b.seiten
  if (!s || (s.gesund === null && s.betroffen === null)) return null
  const w = seitenWerte(test, b, kg)
  if (w && w.einheit === 'N/kg') {
    return { gesund: mitEinheit(w.gesund, 'N/kg'), betroffen: mitEinheit(w.betroffen, 'N/kg'), gesundEingabe: mitEinheit(s.gesund, s.einheit), betroffenEingabe: mitEinheit(s.betroffen, s.einheit) }
  }
  return { gesund: mitEinheit(s.gesund, s.einheit), betroffen: mitEinheit(s.betroffen, s.einheit), gesundEingabe: null, betroffenEingabe: null }
}

/** Normdaten wie in der Testkarte – nur bei passender Gruppe, sonst nichts (Audit Punkt 11, Frage 3a). */
function normdatenText(test: TestDef, patient: Patient, testung: Testung): string | null {
  const n = normdatenFuer(test.id, patient, testung.datum, monateBisTestung(patient.opDatum, testung.datum), boxTatsaechlich(test, testung.eingaben[test.id] ?? {}, testung.datum))
  if (!n || n.keine || n.zeilen.length === 0) return null
  return `${n.kopf}: ${n.zeilen.join(' · ')}${n.hinweis ? ` – ${n.hinweis}` : ''}`
}

function arztTest(
  test: TestDef,
  testung: Testung,
  a: TestAuswertung,
  phase: Testung['phase'],
  vorschlag: RtsVorschlag | null,
  auswahl: MeloqAuswahl | undefined,
  hq: ReturnType<typeof hqQuotient>,
  patient: Patient,
): ArztTest {
  const seite = patient.seite
  const b = a.berechnung
  const eingabe = testung.eingaben[test.id] ?? {}
  const gemessen = hatEingabe(testung.eingaben[test.id])
  const kg = parseZahl(testung.koerpergewichtKg)
  const r = impulsRichtung(test, eingabe, b, seite)
  const kriterien = a.ergebnis.kriterien
    .filter((e) => e.zustand !== 'nicht_anwendbar')
    .map((e) => ({
      bezeichnung: e.kriterium.bezeichnung,
      status: STATUS_NAMEN[e.kriterium.status],
      wert: wertText(e),
      wertHinweis: r && e.kriterium.id === 'impuls_asymmetrie' && e.zustand === 'bewertet' ? RICHTUNG_ARZT[r] : null,
      ziel: zielText(e) || '–',
      bewertung: gemessen && ohneGewicht(e, kg) ? { ampel: null, text: `Körpergewicht fehlt – keine ${e.kriterium.einheit}` } : bewertungText(e),
      quelle: e.kriterium.quelle,
    }))
  // Vorverletzungswert als eigene Zeile, ohne Ampel (F22; Audit Punkt 13)
  if (b.lsiVorverletzung !== null) {
    kriterien.push({
      bezeichnung: 'LSI zur Vorverletzung',
      status: 'Info',
      wert: `${b.lsiVorverletzung.toLocaleString('de-AT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`,
      wertHinweis: null,
      ziel: '–',
      bewertung: { ampel: null, text: 'Info (ohne Ampel)' },
      quelle: KATALOG.regeln.lsi.quelle,
    })
  }
  const zusatz: string[] = [...a.ergebnis.hinweise]
  if (b.nmProKg) zusatz.push(`Drehmoment relativ: gesund ${zahl(b.nmProKg.gesund, 2)} · betroffen ${zahl(b.nmProKg.betroffen, 2)} Nm/kg`)
  if (hq) {
    const pct = (q: number | null) => (q === null ? '–' : `${zahl(q * 100, 0)} %`)
    zusatz.push(`H/Q-Quotient (Flexion 90° / Extension 60°${hq.ausDrehmoment ? ', aus Nm/kg' : ', aus Kraft – gleicher Hebelarm angenommen, grobe Orientierung'}): gesund ${pct(hq.gesund)} · betroffen ${pct(hq.betroffen)} – nur Info. ${HQ_HINWEIS}`)
  }
  for (const st of b.streuung) zusatz.push(streuungHinweis(st.seite, st.cv))
  const hopBein = beinlaengeText(test, b, patient)
  if (hopBein) zusatz.push(hopBein)
  if (test.id === 'koos') {
    const e = testung.eingaben.koos ?? {}
    const teile = KOOS_SUBSKALEN.filter(([id]) => parseZahl(e[`koos_${id}`]) !== null).map(([id, name]) => `${name} ${zahl(parseZahl(e[`koos_${id}`]))}`)
    if (teile.length > 0) zusatz.push(`KOOS-Subskalen: ${teile.join(' · ')}`)
  }
  const anders = vorschlag?.pflicht.find((p) => p.test.id === test.id)?.klinischAnders
  return {
    test,
    gemessen,
    seiten: seitenText(test, b, kg),
    seitenSpalten: seitenSpalten(test, b, kg),
    protokoll: gemessen ? protokollTeile(test, eingabe, testung.datum) : [],
    normdaten: gemessen ? normdatenText(test, patient, testung) : null,
    kriterien,
    meloq: meloqWerte(test, testung, a, auswahl, seite),
    klinischAnders: anders ? { urteil: anders.urteil === 'erfuellt' ? 'als erfüllt beurteilt' : 'als nicht erfüllt beurteilt', begruendung: anders.begruendung } : null,
    zusatz,
    ausserhalbTestset: !!phase && !test.phasen.includes(phase),
  }
}

export function arztBericht(patient: Patient, testung: Testung, auswahl?: MeloqAuswahl): ArztBericht {
  const p = phaseText(testung, patient)
  const phase = p.ph.phase
  const auswertung = werteAus(testung, phase, patient.geschlecht)
  const vorschlag = p.ph.art === 'endtestung' ? rtsVorschlag(testung, patient, auswertung, phase) : null
  const abgeschlossen = testung.status === 'abgeschlossen'

  let rts: ArztBericht['rts'] = null
  if (vorschlag) {
    const erfuellt = vorschlagErfuellt(testung, vorschlag)
    const e = testung.entscheidung
    const ende = abgeschlossen ? endErgebnis(e, erfuellt) : null
    rts = {
      vorschlag: erfuellt ? RTS_TEXT.erfuellt : RTS_TEXT.nicht_erfuellt,
      erfuellt,
      // „noch nicht gemessen“ ist falsch, wenn nur das Körpergewicht fehlt (Audit Punkt 10) – gleicher Text wie in rtsVorschlag
      wasFehlt: vorschlag.wasFehlt.map((w) => {
        const p = vorschlag.pflicht.find((x) => w === `${x.test.name}: noch nicht gemessen`)
        return p && wartetAufGewicht(testung, auswertung.get(p.test.id)) ? `${p.test.name}: Körpergewicht fehlt – keine N/kg bzw. Ns/kg` : w
      }),
      wuenschenswert: vorschlag.wuenschenswertNichtErreicht,
      aclRsiWarnung: vorschlag.aclRsiWarnung,
      hinweise: vorschlag.hinweise,
      entscheidung:
        ende && e?.art
          ? { text: ENTSCHEIDUNG_TEXT[e.art], ergebnis: ende === 'erfuellt' ? RTS_TEXT.erfuellt : RTS_TEXT.nicht_erfuellt, begruendung: e.begruendung.trim() }
          : null,
    }
  }

  const tests = sichtbareTests(testung, phase)
  const bloecke = BLOECKE.map((block) => ({
    block,
    name: BLOCK_NAMEN[block],
    tests: tests
      .filter((t) => t.block === block)
      .map((t) => {
        const hq = t.id === 'hhd_knie_flex' ? hqQuotient(auswertung.get(t.id)?.berechnung, auswertung.get('hhd_knie_ext')?.berechnung) : null
        return arztTest(t, testung, auswertung.get(t.id)!, phase, vorschlag, auswahl, hq, patient)
      }),
  })).filter((b) => b.tests.length > 0)

  // Anhang (Audit Punkte 8, 9): Protokolle und Einzelversuche der gemessenen Tests
  const gemessen = tests.filter((t) => hatEingabe(testung.eingaben[t.id]))
  const protokolle = [...new Set(['allgemein', ...gemessen.map((t) => t.protokoll).filter((x): x is string => !!x)])]
    .map((id) => protokollNach(id))
    .filter((x) => !!x)
    .map((x) => ({ name: x!.name, ablauf: x!.ablauf, quelle: x!.quelle }))
  const roh = gemessen.map((t) => rohdaten(t, testung.eingaben[t.id] ?? {}, auswertung.get(t.id)!.berechnung)).filter((x): x is RohTest => x !== null)

  return {
    kuerzel: patient.kuerzel,
    datum: datumDeutsch(testung.datum),
    artText: ART_TEXT[p.ph.art],
    entwurf: !abgeschlossen,
    phase: { name: p.name, uebersteuert: p.uebersteuert },
    stammdaten: stammdaten(patient, testung),
    rts,
    stand: pflichtStand(vorschlag ?? rtsVorschlag(testung, patient, auswertung, phase), testung, auswertung, p.kurz),
    bloecke,
    therapeut: testung.entscheidung?.therapeut.trim() ?? '',
    abgeschlossenAm: abgeschlossen && testung.abgeschlossenAm ? datumDeutsch(testung.abgeschlossenAm.slice(0, 10)) : null,
    protokolle,
    rohdaten: roh,
  }
}

// ---------- Verlauf im Arztbericht (Tabelle) ----------

export interface VerlaufZelle {
  /** Wert mit Ampel-Zeichen, z. B. „83,3 % ~“ – „–“ ohne Wert */
  wert: string
  /** Ziel der Phase dieser Testung – nur gesetzt, wenn es sich in der Zeile zwischen den Testungen ändert (Audit Punkt 3) */
  ziel: string | null
  /** Absolutwerte je Seite, z. B. „b 7,8 · g 8,3 N/kg“ (Audit Punkt 4) */
  seiten: string | null
}

export interface VerlaufTabelle {
  spalten: { datum: string; phase: string }[]
  /** kriterium leer, wenn es schon im Testnamen steht (z. B. „Erguss (Stroke-Test)“) */
  zeilen: {
    name: string
    kriterium: string
    werte: VerlaufZelle[]
    /** rohe Differenz dieser Testung zur vorigen mit Wert, z. B. „+10,6 Pkt. · betroffen +1,4 N/kg“ (Audit Punkt 17) */
    veraenderung: string | null
  }[]
}

/** Vorzeichen-Zahl mit einer Nachkommastelle: „+1,4“, „−3“, „±0“ */
function differenz(d: number, einheit: string): string {
  const r = Math.round(d * 10) / 10
  const text = Math.abs(r).toLocaleString('de-AT', { maximumFractionDigits: einheit === 's' ? 2 : 1 })
  return `${r > 0 ? '+' : r < 0 ? '−' : '±'}${text} ${einheit}`
}

const MAX_SPALTEN = 6

/** Höchstens 6 Testungen: die erste (Ausgangswert) bleibt immer, dazu die letzten 5 (Audit Punkt 20). */
function auswahlSpalten<T>(reihe: T[]): T[] {
  return reihe.length <= MAX_SPALTEN ? reihe : [reihe[0], ...reihe.slice(-(MAX_SPALTEN - 1))]
}

/** Hauptwert der Pflicht-Tests (LSI, sonst das erste Pflicht-Kriterium) über die Testungen bis zu dieser. */
export function verlaufTabelle(patient: Patient, testungen: readonly Testung[], bis: Testung): VerlaufTabelle {
  const reihe = auswahlSpalten(
    [...testungen]
      .filter((t) => t.id === bis.id || t.datum <= bis.datum)
      .sort((x, y) => x.datum.localeCompare(y.datum) || x.angelegtAm.localeCompare(y.angelegtAm)),
  )
  const ausgewertet = reihe.map((t) => {
    const ph = phasenStand(t, patient.opDatum).phase
    return { t, ph, a: werteAus(t, ph, patient.geschlecht) }
  })
  const phase = phasenStand(bis, patient.opDatum).phase
  const zeilen: VerlaufTabelle['zeilen'] = []
  for (const test of sichtbareTests(bis, phase)) {
    const pflicht = test.kriterien.filter((k) => k.status === 'pflicht')
    const k = pflicht.find((x) => x.art === 'lsi') ?? pflicht[0]
    if (!k) continue
    const zellen = ausgewertet.map(({ t, a }) => {
      const aus = a.get(test.id)
      const e = aus?.ergebnis.kriterien.find((x) => x.kriterium.id === k.id)
      const s = aus && hatEingabe(t.eingaben[test.id]) ? seitenWerte(test, aus.berechnung, parseZahl(t.koerpergewichtKg)) : null
      if (!e || e.zustand !== 'bewertet') return { wert: '–', ziel: '', zahl: null, s: null }
      return { wert: `${wertText(e)}${e.ampel ? ` ${AMPEL_ZEICHEN[e.ampel]}` : ''}`, ziel: zielText(e), zahl: typeof e.wert === 'number' ? e.wert : null, s }
    })
    const zieleVerschieden = new Set(zellen.filter((z) => z.wert !== '–').map((z) => z.ziel)).size > 1
    const nk = (einheit: string) => (einheit === 's' ? 2 : 1)
    const werte = zellen.map((z) => ({
      wert: z.wert,
      ziel: zieleVerschieden && z.wert !== '–' && z.ziel ? z.ziel : null,
      seiten: z.s && (z.s.betroffen !== null || z.s.gesund !== null) ? `b ${zahl(z.s.betroffen, nk(z.s.einheit))} · g ${zahl(z.s.gesund, nk(z.s.einheit))} ${z.s.einheit}` : null,
    }))
    // Veränderung: diese Testung (letzte Spalte) zur vorigen mit Wert – rohe Differenz der angezeigten Zahlen
    let veraenderung: string | null = null
    const jetzt = zellen[zellen.length - 1]
    const vorher = [...zellen.slice(0, -1)].reverse().find((z) => z.zahl !== null)
    if (jetzt && jetzt.zahl !== null && vorher && vorher.zahl !== null) {
      const teile = [differenz(jetzt.zahl - vorher.zahl, k.einheit === '%' ? 'Pkt.' : (k.einheit ?? ''))]
      if (k.art !== 'absolut' && jetzt.s?.betroffen != null && vorher.s?.betroffen != null && jetzt.s.einheit === vorher.s.einheit) {
        teile.push(`betroffen ${differenz(jetzt.s.betroffen - vorher.s.betroffen, jetzt.s.einheit)}`)
      }
      veraenderung = teile.join(' · ')
    }
    const kriterium = test.name.includes(k.bezeichnung) ? '' : k.bezeichnung
    if (werte.some((w) => w.wert !== '–')) zeilen.push({ name: test.name, kriterium, werte, veraenderung })
  }
  return {
    spalten: ausgewertet.map(({ t, ph }) => ({ datum: datumDeutsch(t.datum), phase: phaseNach(ph).name })),
    zeilen,
  }
}

// ---------- Pat./Trainer-Bericht ----------

/**
 * Alltagsnamen: lang für Tabelle und „Was fehlt noch?“, kurz für das Spinnennetz,
 * verteilung für die eigene Zeile „Unterschied zwischen den Beinen“ (sonst lang).
 */
export const ALLTAG: Record<string, { lang: string; kurz: string; verteilung?: string }> = {
  erguss: { lang: 'Schwellung im Knie', kurz: 'Schwellung' },
  rom_extension: { lang: 'Knie ganz strecken', kurz: 'Streckung' },
  rom_flexion: { lang: 'Knie beugen', kurz: 'Beugung' },
  slr: { lang: 'Bein gestreckt heben', kurz: 'Bein heben' },
  hhd_knie_ext: { lang: 'Kraft Oberschenkel vorne (Knie strecken)', kurz: 'Kraft vorne' },
  hhd_knie_flex: { lang: 'Kraft Oberschenkel hinten (Knie beugen)', kurz: 'Kraft hinten' },
  hhd_knie_flex_60: { lang: 'Kraft Oberschenkel hinten bei 60° (Knie beugen)', kurz: 'Kraft hinten 60°' },
  hhd_knie_flex_30: { lang: 'Kraft Oberschenkel hinten bei 30° (Knie beugen)', kurz: 'Kraft hinten 30°' },
  hhd_hueft_abd: { lang: 'Kraft Hüfte seitlich', kurz: 'Kraft Hüfte' },
  plantarflexion: { lang: 'Kraft Wade', kurz: 'Kraft Wade' },
  kniebeuge_asym: { lang: 'Kniebeuge – Verteilung auf beide Beine', kurz: 'Kniebeuge' },
  sl_balance: { lang: 'Gleichgewicht auf einem Bein', kurz: 'Gleichgewicht' },
  cmj: { lang: 'Sprung beidbeinig (Höhe)', kurz: 'Sprung beidbeinig', verteilung: 'Sprung beidbeinig – Verteilung auf beide Beine' },
  sl_cmj: { lang: 'Sprung einbeinig (Höhe)', kurz: 'Sprung einbeinig' },
  dj_bilateral: { lang: 'Niedersprung beidbeinig', kurz: 'Niedersprung beidb.', verteilung: 'Niedersprung beidbeinig – Verteilung auf beide Beine' },
  sl_dj: { lang: 'Niedersprung einbeinig (Höhe)', kurz: 'Niedersprung' },
  imtp: { lang: 'Maximalkraft Beine (Zug im Stand)', kurz: 'Maximalkraft' },
  hop_platte: { lang: 'Hüpfen – Verteilung auf beide Beine', kurz: 'Hüpfen' },
  single_hop: { lang: 'Weitsprung einbeinig', kurz: 'Weitsprung' },
  triple_hop: { lang: '3 Sprünge einbeinig', kurz: '3er-Sprung' },
  crossover_hop: { lang: '3 Sprünge einbeinig über eine Linie', kurz: 'Crossover' },
  timed_hop: { lang: '6 m einbeinig hüpfen (Zeit)', kurz: '6 m auf Zeit' },
  side_hop: { lang: 'Seitliches Hüpfen 30 s', kurz: 'Seitsprünge' },
  bridge_beidbeinig: { lang: 'Becken heben beidbeinig', kurz: 'Becken heben' },
  calf_raise_beidbeinig: { lang: 'Zehenstand beidbeinig', kurz: 'Zehenstand' },
  sl_bridge: { lang: 'Becken heben einbeinig', kurz: 'Becken heben' },
  sl_calf_raise: { lang: 'Zehenstand einbeinig', kurz: 'Zehenstand' },
  sl_sit_to_stand: { lang: 'Aufstehen einbeinig', kurz: 'Aufstehen' },
  sl_squat: { lang: 'Kniebeuge einbeinig (Tiefe)', kurz: 'Kniebeuge' },
  acl_rsi: { lang: 'Vertrauen ins Knie (Fragebogen)', kurz: 'Vertrauen' },
}

const alltag = (t: TestDef) => ALLTAG[t.id] ?? { lang: t.name, kurz: t.name }
const verteilungName = (t: TestDef) => alltag(t).verteilung ?? alltag(t).lang

/** Blöcke mit Leistungswerten (Output) – ohne Klinik und Fragebögen (Etappe-9-Frage 2). */
const LEISTUNG: readonly Block[] = ['hhd', 'platten', 'hops', 'kraftausdauer']
/**
 * Driver-Werte (ODS) gehören nicht in den Pat./Trainer-Bericht – nur Output.
 * Ausnahme (Bericht-Audit Punkt 2): Ist die Impuls-Asymmetrie Pflicht (CMJ) oder der einzige Wert des Tests (Hop auf der Platte), bekommt sie eine eigene Zeile.
 */
const DRIVER = ['impuls_asymmetrie', 'net_impulse']

const ALLTAG_VERGLEICH = { '>': 'über', '>=': 'mindestens', '<': 'unter', '<=': 'höchstens' } as const

/** Ein nicht erreichtes Kriterium in Alltagssprache. */
export function kriteriumAlltag(e: KriteriumErgebnis): string {
  const k = e.kriterium
  const ziel = e.schwelle && k.vergleich ? `${ALLTAG_VERGLEICH[k.vergleich]} ${e.schwelle.wert.toLocaleString('de-AT')}${k.einheit === '%' ? ' %' : k.einheit ? ` ${k.einheit}` : ''}` : ''
  if (k.art === 'lsi') return `das betroffene Bein schafft ${wertText(e)} des gesunden – Ziel: ${ziel}`
  if (k.art === 'asymmetrie') return `${wertText(e)} Unterschied zwischen den Beinen – Ziel: ${ziel}`
  if (k.art === 'auswahl' || k.art === 'janein') return 'noch nicht ganz in Ordnung'
  const was = k.einheit === 'N/kg' ? 'Kraft pro kg Körpergewicht' : k.id === 'hoehe' ? 'Sprunghöhe' : k.id === 'wdh' ? 'Wiederholungen' : k.id === 'defizit' ? 'Streckdefizit' : k.bezeichnung
  return `${was} ${wertText(e)} – Ziel: ${ziel}`
}

export interface PatZeile {
  /** Test-id; die Zeile „Verteilung auf beide Beine“ hat `<test>:verteilung` */
  id: string
  name: string
  /** Kurzname für das Spinnennetz */
  kurz: string
  /** gesund/betroffen oder ein Wert (beidbeinig bzw. Unterschied zwischen den Beinen) */
  gesund: string | null
  betroffen: string | null
  wert: string | null
  wertArt: 'beidbeinig' | 'unterschied' | null
  lsi: number | null
  /** Ampel des LSI-Kriteriums – für das Spinnennetz */
  lsiAmpel: Ampel | null
  /** betroffen in % des Werts vor der Verletzung (nur wenn eingetragen; Audit Punkt 13) */
  vorverletzung: number | null
  /** betroffen in % von gesund bei der vorigen Testung (Audit Punkt 16) */
  vorige: number | null
  bewertung: Bewertung
}

export interface PatBericht {
  kuerzel: string
  datum: string
  artText: string
  phase: string
  entwurf: boolean
  klinik: string | null
  zeilen: PatZeile[]
  netz: NetzAchse[]
  /** Verlaufstest: „Ziele dieser Phase – noch offen“, Endtestung: „Was fehlt noch?“ (Audit Punkt 15) */
  wasFehltTitel: string
  /** z. B. „Schon erreicht: 3 von 12 Zielen dieser Phase“ */
  erreicht: string | null
  wasFehlt: string[]
  /** Datum der vorigen Testung für „letzte Testung“, null wenn es keine gibt */
  vorigeDatum: string | null
  hinweise: string[]
  /** nur bei abgeschlossener Endtestung: Ergebnis nach Beurteilung der Therapeut:in */
  ergebnis: string | null
}

const RANG: Record<Ampel, number> = { gruen: 0, gelb: 1, rot: 2 }

/** Bewertung einer Zeile = die schlechteste der zählenden Kriterien. */
function zeilenBewertung(kriterien: KriteriumErgebnis[]): Bewertung {
  const zaehlend = kriterien.filter((e) => e.zaehlt && e.ampel)
  const schlechteste = zaehlend.reduce<KriteriumErgebnis | null>((x, e) => (!x || RANG[e.ampel!] > RANG[x.ampel!] ? e : x), null)
  const offen = kriterien.some((e) => (e.kriterium.status === 'pflicht' || e.kriterium.status === 'wuenschenswert') && e.zustand === 'offen')
  return schlechteste ? { ampel: schlechteste.ampel!, text: AMPEL_TEXT[schlechteste.ampel!] } : { ampel: null, text: offen ? 'nicht vollständig' : '–' }
}

const istAsymmetrie = (e: KriteriumErgebnis) => e.kriterium.art === 'asymmetrie'

/**
 * Zeilen eines Tests: Hauptzeile (Seiten bzw. beidbeiniger Wert) und – wo nötig – eine eigene Zeile
 * „Verteilung auf beide Beine“ für den Unterschied zwischen den Beinen (Bericht-Audit Punkt 2).
 */
function patZeilen(test: TestDef, a: TestAuswertung, eingabe: TestEingabe, seite: Patient['seite']): PatZeile[] {
  const s = a.berechnung.seiten
  const haupt = a.ergebnis.kriterien.filter((e) => !DRIVER.includes(e.kriterium.id) && !istAsymmetrie(e))
  const einzeln = haupt.filter((e) => e.zustand !== 'nicht_anwendbar' && typeof e.wert === 'number' && e.kriterium.art !== 'lsi')
  const hatHaupt = !!s || einzeln.length > 0
  const zeilen: PatZeile[] = []

  if (hatHaupt) {
    const lsiWert = a.berechnung.werte.lsi
    const lsiE = haupt.find((e) => e.kriterium.art === 'lsi' && e.zustand === 'bewertet')
    zeilen.push({
      id: test.id,
      name: alltag(test).lang,
      kurz: alltag(test).kurz,
      gesund: s ? mitEinheit(s.gesund, s.einheit) : null,
      betroffen: s ? mitEinheit(s.betroffen, s.einheit) : null,
      wert: s ? null : einzeln.map((e) => wertText(e)).join(' · '),
      wertArt: s ? null : 'beidbeinig',
      lsi: typeof lsiWert === 'number' && Number.isFinite(lsiWert) ? Math.round(lsiWert * 10) / 10 : null,
      lsiAmpel: lsiE?.ampel ?? null,
      vorverletzung: a.berechnung.lsiVorverletzung === null ? null : Math.round(a.berechnung.lsiVorverletzung * 10) / 10,
      vorige: null,
      bewertung: zeilenBewertung(haupt),
    })
  }

  // Asymmetrie: eigene Zeile, außer sie ist ein Driver-Wert neben einer Hauptzeile (z. B. SL-CMJ, wünschenswert)
  const asym = a.ergebnis.kriterien.filter(
    (e) => istAsymmetrie(e) && typeof e.wert === 'number' && (!DRIVER.includes(e.kriterium.id) || e.kriterium.status === 'pflicht' || !hatHaupt),
  )
  if (asym.length > 0) {
    // Richtung nur beim Net Impulse bekannt (L/R bzw. gesund/betroffen) – Audit Punkt 6
    const r = asym.some((e) => e.kriterium.id === 'impuls_asymmetrie') ? impulsRichtung(test, eingabe, a.berechnung, seite) : null
    zeilen.push({
      id: `${test.id}:verteilung`,
      name: verteilungName(test),
      kurz: alltag(test).kurz,
      gesund: null,
      betroffen: null,
      wert: `${asym.map((e) => wertText(e)).join(' · ')}${r ? ` – ${RICHTUNG_PAT[r]}` : ''}`,
      wertArt: 'unterschied',
      lsi: null,
      lsiAmpel: null,
      vorverletzung: null,
      vorige: null,
      bewertung: zeilenBewertung(asym),
    })
  }
  return zeilen
}

const lsiGerundet = (a: TestAuswertung | undefined) => {
  const w = a?.berechnung.werte.lsi
  return typeof w === 'number' && Number.isFinite(w) ? Math.round(w * 10) / 10 : null
}

/** Die Testung direkt vor dieser (nach Datum, bei gleichem Datum nach Anlage). */
function vorigeTestung(alle: readonly Testung[], testung: Testung): Testung | null {
  const davor = alle
    .filter((t) => t.id !== testung.id && (t.datum < testung.datum || (t.datum === testung.datum && t.angelegtAm < testung.angelegtAm)))
    .sort((x, y) => x.datum.localeCompare(y.datum) || x.angelegtAm.localeCompare(y.angelegtAm))
  return davor.at(-1) ?? null
}

/** `alle`: alle Testungen der Person – für den Vergleich mit der vorigen Testung (Audit Punkt 16). */
export function patBericht(patient: Patient, testung: Testung, alle: readonly Testung[] = []): PatBericht {
  const p = phaseText(testung, patient)
  const phase = p.ph.phase
  const auswertung = werteAus(testung, phase, patient.geschlecht)
  const tests = sichtbareTests(testung, phase)
  const endtestung = p.ph.art === 'endtestung'
  const v = rtsVorschlag(testung, patient, auswertung, phase)

  const zeilen = tests.filter((t) => LEISTUNG.includes(t.block) && hatEingabe(testung.eingaben[t.id])).flatMap((t) => patZeilen(t, auswertung.get(t.id)!, testung.eingaben[t.id] ?? {}, patient.seite))

  // Klinik in einer Zeile (Etappe-9-Frage 2)
  const klinik = tests.filter((t) => t.block === 'klinik').map((t) => pflichtStatus(auswertung.get(t.id)!)?.status)
  const klinikText =
    klinik.length === 0
      ? null
      : klinik.some((s) => s === 'nicht_erfuellt')
        ? 'Kniebefund (Schwellung, Beweglichkeit, Bein heben): noch nicht ganz in Ordnung'
        : klinik.every((s) => s === 'erfuellt')
          ? 'Kniebefund (Schwellung, Beweglichkeit, Bein heben): in Ordnung'
          : 'Kniebefund: noch nicht vollständig untersucht'

  // Vorige Testung: LSI von damals neben dem heutigen, nur wo es beide gibt
  const vorige = vorigeTestung(alle, testung)
  if (vorige) {
    const vorAuswertung = werteAus(vorige, phasenStand(vorige, patient.opDatum).phase, patient.geschlecht)
    for (const z of zeilen) {
      if (z.lsi === null || !hatEingabe(vorige.eingaben[z.id])) continue
      z.vorige = lsiGerundet(vorAuswertung.get(z.id))
    }
  }

  const wasFehlt: string[] = []
  const nichtGetestet: string[] = []
  if (endtestung && !v.zeitErfuellt) wasFehlt.push(`Zeit seit der ${patient.konservativ ? 'Verletzung' : 'OP'}: ${v.monate ?? '?'} Monate – empfohlen sind mindestens ${KATALOG.regeln.rts.mindestMonate} Monate`)
  for (const pt of v.pflicht) {
    if (pt.status === 'erfuellt') continue
    const name = alltag(pt.test).lang
    if (pt.klinischAnders) wasFehlt.push(`${name}: aus therapeutischer Sicht noch nicht so weit`)
    else if (pt.status === 'fehlt') {
      if (wartetAufGewicht(testung, auswertung.get(pt.test.id))) wasFehlt.push(`${name}: Körpergewicht fehlt noch für die Auswertung`)
      else nichtGetestet.push(name)
    } else {
      // Unterschied zwischen den Beinen unter dem Namen der Verteilungs-Zeile (Audit Punkt 2)
      const verfehlt = pflichtVerfehlt(auswertung.get(pt.test.id)!)
      const rest = verfehlt.filter((e) => !istAsymmetrie(e))
      const asym = verfehlt.filter(istAsymmetrie)
      if (rest.length > 0) wasFehlt.push(`${name}: ${rest.map(kriteriumAlltag).join('; ')}`)
      if (asym.length > 0) wasFehlt.push(`${verteilungName(pt.test)}: ${asym.map(kriteriumAlltag).join('; ')}`)
    }
  }

  // Nicht Getestetes in einer Zeile am Ende (Audit Punkt 15)
  if (nichtGetestet.length > 0) wasFehlt.push(`Noch nicht (vollständig) getestet: ${nichtGetestet.join(', ')}`)
  const erfuellt = v.pflicht.filter((pt) => pt.status === 'erfuellt').length
  const erreicht = v.pflicht.length === 0 ? null : `Schon erreicht: ${erfuellt} von ${v.pflicht.length} ${endtestung ? 'Pflicht-Zielen' : 'Zielen dieser Phase'}`

  const hinweise: string[] = []
  if (v.aclRsiWarnung) hinweise.push('Vertrauen ins Knie: Der Fragebogen zeigt noch Unsicherheit oder Sorge vor einer neuen Verletzung – das ist normal und wird in der Therapie besprochen.')

  let ergebnis: string | null = null
  if (endtestung && testung.status === 'abgeschlossen') {
    const ende = endErgebnis(testung.entscheidung, vorschlagErfuellt(testung, v))
    if (ende) ergebnis = ende === 'erfuellt' ? RTS_TEXT.erfuellt : RTS_TEXT.nicht_erfuellt
  }

  return {
    kuerzel: patient.kuerzel,
    datum: datumDeutsch(testung.datum),
    artText: ART_TEXT[p.ph.art],
    phase: p.name,
    entwurf: testung.status !== 'abgeschlossen',
    klinik: klinikText,
    zeilen,
    netz: zeilen.filter((z) => z.lsi !== null).map((z) => ({ name: z.kurz, lsi: z.lsi!, ampel: z.lsiAmpel, vorige: z.vorige })),
    wasFehltTitel: endtestung ? 'Was fehlt noch?' : 'Ziele dieser Phase – noch offen',
    erreicht,
    wasFehlt,
    vorigeDatum: vorige ? datumDeutsch(vorige.datum) : null,
    hinweise,
    ergebnis,
  }
}
