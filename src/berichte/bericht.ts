// Inhalte von Arztbericht und Pat./Trainer-Bericht (docs/ENTSCHEIDUNGEN.md 10; Etappe-9-Fragen).
// Nur Daten aus der Testung – der Name der Pat. kommt hier nie vor: er wird nur in der Druckansicht eingesetzt und nie gespeichert (F9).
// Formulierung nie „Freigabe“ (F36).

import type { Testung } from '../db'
import { KATALOG, phaseNach } from '../katalog'
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
import { hatEingabe, KOOS_SUBSKALEN, parseZahl } from '../testung/erfassung'
import { AMPEL_TEXT } from '../testung/Ladebalken'
import { kernStrategie, zusatzZeilen, type MeloqZeile } from '../testung/meloq'
import type { MeloqAuswahl } from '../testung/meloqAuswahl'
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
  ziel: string
  bewertung: Bewertung
  quelle: string
}

export interface ArztTest {
  test: TestDef
  gemessen: boolean
  /** Bestwerte gesund/betroffen, z. B. „gesund 65 kg · betroffen 61 kg“ */
  seiten: string | null
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
  bloecke: { block: Block; name: string; tests: ArztTest[] }[]
  therapeut: string
  abgeschlossenAm: string | null
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

function meloqWerte(test: TestDef, testung: Testung, a: TestAuswertung, auswahl: MeloqAuswahl | undefined): ArztTest['meloq'] {
  if (!istMeloqTest(test.id)) return []
  const e = testung.eingaben[test.id] ?? {}
  const zeilen = [kernStrategie(test.id, e, a.berechnung), ...(auswahl ? zusatzZeilen(test.id, e, auswahl[test.id], parseZahl(testung.koerpergewichtKg)) : [])]
  return zeilen
    .filter((z) => z.werte.some((w) => w !== null))
    .map((z) => {
      const nk = z.einheit === 'ms' ? 0 : 1
      const roh = z.form === 'eins' ? `${zahl(z.werte[0], nk)} ${z.einheit}` : `${z.form === 'lr' ? 'L' : 'gesund'} ${zahl(z.werte[0], nk)} · ${z.form === 'lr' ? 'R' : 'betroffen'} ${zahl(z.werte[1], nk)} ${z.einheit}`
      const rel = z.relativ && z.relativ.werte.some((w) => w !== null) ? ` (${z.relativ.werte.map((w) => zahl(w, z.relativ!.einheit === 'N/s' ? 0 : 1)).join(' / ')} ${z.relativ.einheit})` : ''
      const v = z.vergleich && z.vergleich.wert !== null ? `${z.vergleich.art === 'lsi' ? 'LSI' : 'Asymmetrie'} ${zahl(z.vergleich.wert)} %` : ''
      return { ods: z.ods, name: z.name, wert: roh + rel, vergleich: v }
    })
}

function arztTest(test: TestDef, testung: Testung, a: TestAuswertung, phase: Testung['phase'], vorschlag: RtsVorschlag | null, auswahl: MeloqAuswahl | undefined): ArztTest {
  const b = a.berechnung
  const s = b.seiten
  const seiten = s && (s.gesund !== null || s.betroffen !== null) ? `gesund ${mitEinheit(s.gesund, s.einheit)} · betroffen ${mitEinheit(s.betroffen, s.einheit)}` : null
  const kriterien = a.ergebnis.kriterien
    .filter((e) => e.zustand !== 'nicht_anwendbar')
    .map((e) => ({
      bezeichnung: e.kriterium.bezeichnung,
      status: STATUS_NAMEN[e.kriterium.status],
      wert: wertText(e),
      ziel: zielText(e) || '–',
      bewertung: bewertungText(e),
      quelle: e.kriterium.quelle,
    }))
  const zusatz: string[] = [...a.ergebnis.hinweise]
  if (b.lsiVorverletzung !== null) zusatz.push(`LSI zur Vorverletzung: ${zahl(b.lsiVorverletzung)} %`)
  if (b.nmProKg) zusatz.push(`Drehmoment relativ: gesund ${zahl(b.nmProKg.gesund, 2)} · betroffen ${zahl(b.nmProKg.betroffen, 2)} Nm/kg`)
  for (const st of b.streuung) zusatz.push(`Streuung ${st.seite} ${zahl(st.cv)} % (> 10 %) – Messung ggf. wiederholt`)
  if (test.id === 'koos') {
    const e = testung.eingaben.koos ?? {}
    const teile = KOOS_SUBSKALEN.filter(([id]) => parseZahl(e[`koos_${id}`]) !== null).map(([id, name]) => `${name} ${zahl(parseZahl(e[`koos_${id}`]))}`)
    if (teile.length > 0) zusatz.push(`KOOS-Subskalen: ${teile.join(' · ')}`)
  }
  const anders = vorschlag?.pflicht.find((p) => p.test.id === test.id)?.klinischAnders
  return {
    test,
    gemessen: hatEingabe(testung.eingaben[test.id]),
    seiten,
    kriterien,
    meloq: meloqWerte(test, testung, a, auswahl),
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
      wasFehlt: vorschlag.wasFehlt,
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
    tests: tests.filter((t) => t.block === block).map((t) => arztTest(t, testung, auswertung.get(t.id)!, phase, vorschlag, auswahl)),
  })).filter((b) => b.tests.length > 0)

  return {
    kuerzel: patient.kuerzel,
    datum: datumDeutsch(testung.datum),
    artText: ART_TEXT[p.ph.art],
    entwurf: !abgeschlossen,
    phase: { name: p.name, uebersteuert: p.uebersteuert },
    stammdaten: stammdaten(patient, testung),
    rts,
    bloecke,
    therapeut: testung.entscheidung?.therapeut.trim() ?? '',
    abgeschlossenAm: abgeschlossen && testung.abgeschlossenAm ? datumDeutsch(testung.abgeschlossenAm.slice(0, 10)) : null,
  }
}

// ---------- Verlauf im Arztbericht (Tabelle) ----------

export interface VerlaufTabelle {
  spalten: { datum: string; phase: string }[]
  zeilen: { name: string; kriterium: string; werte: string[] }[]
}

const MAX_SPALTEN = 6

/** Hauptwert der Pflicht-Tests (LSI, sonst das erste Pflicht-Kriterium) über die Testungen bis zu dieser. */
export function verlaufTabelle(patient: Patient, testungen: readonly Testung[], bis: Testung): VerlaufTabelle {
  const reihe = [...testungen]
    .filter((t) => t.id === bis.id || t.datum <= bis.datum)
    .sort((x, y) => x.datum.localeCompare(y.datum) || x.angelegtAm.localeCompare(y.angelegtAm))
    .slice(-MAX_SPALTEN)
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
    const werte = ausgewertet.map(({ a }) => {
      const e = a.get(test.id)?.ergebnis.kriterien.find((x) => x.kriterium.id === k.id)
      if (!e || e.zustand !== 'bewertet') return '–'
      return `${wertText(e)}${e.ampel ? ` ${AMPEL_ZEICHEN[e.ampel]}` : ''}`
    })
    if (werte.some((w) => w !== '–')) zeilen.push({ name: test.name, kriterium: k.bezeichnung, werte })
  }
  return {
    spalten: ausgewertet.map(({ t, ph }) => ({ datum: datumDeutsch(t.datum), phase: phaseNach(ph).name })),
    zeilen,
  }
}

// ---------- Pat./Trainer-Bericht ----------

/** Alltagsnamen: lang für Tabelle und „Was fehlt noch?“, kurz für das Spinnennetz. */
export const ALLTAG: Record<string, { lang: string; kurz: string }> = {
  erguss: { lang: 'Schwellung im Knie', kurz: 'Schwellung' },
  rom_extension: { lang: 'Knie ganz strecken', kurz: 'Streckung' },
  rom_flexion: { lang: 'Knie beugen', kurz: 'Beugung' },
  slr: { lang: 'Bein gestreckt heben', kurz: 'Bein heben' },
  hhd_knie_ext: { lang: 'Kraft Oberschenkel vorne (Knie strecken)', kurz: 'Kraft vorne' },
  hhd_knie_flex: { lang: 'Kraft Oberschenkel hinten (Knie beugen)', kurz: 'Kraft hinten' },
  hhd_hueft_abd: { lang: 'Kraft Hüfte seitlich', kurz: 'Kraft Hüfte' },
  plantarflexion: { lang: 'Kraft Wade', kurz: 'Kraft Wade' },
  kniebeuge_asym: { lang: 'Kniebeuge – Verteilung auf beide Beine', kurz: 'Kniebeuge' },
  sl_balance: { lang: 'Gleichgewicht auf einem Bein', kurz: 'Gleichgewicht' },
  cmj: { lang: 'Sprung beidbeinig (Höhe)', kurz: 'Sprung beidbeinig' },
  sl_cmj: { lang: 'Sprung einbeinig (Höhe)', kurz: 'Sprung einbeinig' },
  dj_bilateral: { lang: 'Niedersprung beidbeinig', kurz: 'Niedersprung beidb.' },
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

/** Blöcke mit Leistungswerten (Output) – ohne Klinik und Fragebögen (Etappe-9-Frage 2). */
const LEISTUNG: readonly Block[] = ['hhd', 'platten', 'hops', 'kraftausdauer']
/** Driver-Werte (ODS) gehören nicht in den Pat./Trainer-Bericht – nur Output. */
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
  id: string
  name: string
  /** gesund/betroffen oder ein Wert (beidbeinig) */
  gesund: string | null
  betroffen: string | null
  wert: string | null
  lsi: number | null
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
  netz: { name: string; lsi: number }[]
  wasFehlt: string[]
  hinweise: string[]
  /** nur bei abgeschlossener Endtestung: Ergebnis nach Beurteilung der Therapeut:in */
  ergebnis: string | null
}

const RANG: Record<Ampel, number> = { gruen: 0, gelb: 1, rot: 2 }

function patZeile(test: TestDef, a: TestAuswertung): PatZeile {
  const s = a.berechnung.seiten
  const kriterien = a.ergebnis.kriterien.filter((e) => !DRIVER.includes(e.kriterium.id))
  const zaehlend = kriterien.filter((e) => e.zaehlt && e.ampel)
  const schlechteste = zaehlend.reduce<KriteriumErgebnis | null>((x, e) => (!x || RANG[e.ampel!] > RANG[x.ampel!] ? e : x), null)
  const offen = kriterien.some((e) => (e.kriterium.status === 'pflicht' || e.kriterium.status === 'wuenschenswert') && e.zustand === 'offen')
  const bewertung: Bewertung = schlechteste ? { ampel: schlechteste.ampel!, text: AMPEL_TEXT[schlechteste.ampel!] } : { ampel: null, text: offen ? 'nicht vollständig' : '–' }
  const lsiWert = a.berechnung.werte.lsi
  const lsi = typeof lsiWert === 'number' && Number.isFinite(lsiWert) ? Math.round(lsiWert * 10) / 10 : null
  const einzeln = kriterien.filter((e) => e.zustand !== 'nicht_anwendbar' && typeof e.wert === 'number' && e.kriterium.art !== 'lsi')
  return {
    id: test.id,
    name: alltag(test).lang,
    gesund: s ? mitEinheit(s.gesund, s.einheit) : null,
    betroffen: s ? mitEinheit(s.betroffen, s.einheit) : null,
    wert: s ? null : einzeln.map((e) => wertText(e)).join(' · ') || '–',
    lsi,
    bewertung,
  }
}

export function patBericht(patient: Patient, testung: Testung): PatBericht {
  const p = phaseText(testung, patient)
  const phase = p.ph.phase
  const auswertung = werteAus(testung, phase, patient.geschlecht)
  const tests = sichtbareTests(testung, phase)
  const endtestung = p.ph.art === 'endtestung'
  const v = rtsVorschlag(testung, patient, auswertung, phase)

  const zeilen = tests.filter((t) => LEISTUNG.includes(t.block) && hatEingabe(testung.eingaben[t.id])).map((t) => patZeile(t, auswertung.get(t.id)!))

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

  const wasFehlt: string[] = []
  if (endtestung && !v.zeitErfuellt) wasFehlt.push(`Zeit seit der ${patient.konservativ ? 'Verletzung' : 'OP'}: ${v.monate ?? '?'} Monate – empfohlen sind mindestens ${KATALOG.regeln.rts.mindestMonate} Monate`)
  for (const pt of v.pflicht) {
    if (pt.status === 'erfuellt') continue
    const name = alltag(pt.test).lang
    if (pt.klinischAnders) wasFehlt.push(`${name}: aus therapeutischer Sicht noch nicht so weit`)
    else if (pt.status === 'fehlt') wasFehlt.push(`${name}: noch nicht (vollständig) getestet`)
    else wasFehlt.push(`${name}: ${pflichtVerfehlt(auswertung.get(pt.test.id)!).map(kriteriumAlltag).join('; ')}`)
  }

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
    netz: zeilen
      .filter((z) => z.lsi !== null)
      .map((z) => ({ name: alltag(tests.find((t) => t.id === z.id)!).kurz, lsi: z.lsi! })),
    wasFehlt,
    hinweise,
    ergebnis,
  }
}
