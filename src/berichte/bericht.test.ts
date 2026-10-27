import { beforeEach, describe, expect, it } from 'vitest'
import { beispielAnlegen } from '../beispiel'
import { db, type Testung } from '../db'
import type { Patient } from '../patienten/stammdaten'
import { auswahlBereinigen } from '../testung/meloqAuswahl'
import { arztBericht, bewertungText, kriteriumAlltag, patBericht, verlaufTabelle, zeitVergleich } from './bericht'

let patient: Patient
let testungen: Testung[]
let ende: Testung

beforeEach(async () => {
  await db.patienten.clear()
  await db.testungen.clear()
  const id = await beispielAnlegen()
  patient = (await db.patienten.get(id))!
  testungen = (await db.testungen.where('patientId').equals(id).toArray()).sort((a, b) => a.datum.localeCompare(b.datum))
  ende = testungen[2]
})

const abgeschlossen = (t: Testung, teil: Partial<Testung> = {}): Testung => ({
  ...t,
  status: 'abgeschlossen',
  abgeschlossenAm: `${t.datum}T15:00:00.000Z`,
  entscheidung: { art: 'ueberstimmt_erfuellt', begruendung: 'SL-DJ klinisch unauffällig', therapeut: 'PR', vorschlagBeiAbschluss: 'nicht_erfuellt' },
  ...teil,
})

describe('Arztbericht', () => {
  it('enthält Kopf, Stammdaten, Phase und ist als Entwurf markiert, solange in Arbeit', () => {
    const b = arztBericht(patient, ende, auswahlBereinigen(undefined))
    expect(b.kuerzel).toBe('DEMO-1990')
    expect(b.entwurf).toBe(true)
    expect(b.artText).toBe('Endtestung')
    expect(b.phase.uebersteuert).toBeNull()
    const stamm = Object.fromEntries(b.stammdaten)
    expect(stamm['Betroffene Seite']).toBe('links')
    expect(stamm['Graft']).toMatch(/Hamstring/)
    expect(stamm['Körpergewicht']).toBe('78 kg')
  })

  it('zeigt Kern-Satz mit Wert, Ziel, Ampel als Text und Quelle sowie gewählte Meloq-Metriken', () => {
    const b = arztBericht(patient, ende, auswahlBereinigen(undefined))
    const tests = b.bloecke.flatMap((x) => x.tests)
    const sldj = tests.find((t) => t.test.id === 'sl_dj')!
    const lsi = sldj.kriterien.find((k) => k.bezeichnung === 'LSI Sprunghöhe')!
    expect(lsi.wert).toBe('89,7 %')
    expect(lsi.ziel).toBe('≥ 90 %')
    expect(lsi.bewertung).toEqual({ ampel: 'gelb', text: 'knapp' })
    expect(lsi.quelle).toMatch(/Read/)
    expect(sldj.meloq.map((m) => m.name)).toContain('Kontaktzeit')
    const cmj = tests.find((t) => t.test.id === 'cmj')!
    // Start-Standard: Flugzeit, Peak Force L/R, Peak Power L/R
    expect(cmj.meloq.map((m) => m.name)).toEqual(expect.arrayContaining(['Contraction Time', 'Flugzeit']))
    expect(cmj.meloq.find((m) => m.name.startsWith('Peak Force'))?.vergleich).toMatch(/Asymmetrie/)
  })

  it('RTS-Vorschlag ohne Entscheidung, solange in Arbeit; nie „Freigabe“ als Ergebnis', () => {
    const b = arztBericht(patient, ende)
    expect(b.rts?.vorschlag).toBe('Kriterien (noch) nicht erfüllt')
    expect(b.rts?.entscheidung).toBeNull()
    expect(b.rts?.wasFehlt.some((w) => w.startsWith('SL-Drop-Jump'))).toBe(true)
    expect(b.rts?.aclRsiWarnung).toMatch(/ACL-RSI/)
    expect(JSON.stringify(b)).not.toMatch(/Freigabe/i)
  })

  it('nach Abschluss: Entscheidung mit Begründung; klinisch anders beurteilt und übersteuerte Phase markiert', () => {
    const t = abgeschlossen(ende, {
      klinischAnders: { sl_dj: { urteil: 'erfuellt', begruendung: 'Sprungbild sauber' } },
      phaseUebersteuert: { phase: 'rtc', begruendung: 'Re-Arthroskopie' },
    })
    const b = arztBericht(patient, t)
    expect(b.entwurf).toBe(false)
    expect(b.rts?.vorschlag).toBe('Kriterien (noch) nicht erfüllt')
    expect(b.rts?.entscheidung).toEqual({
      text: 'Überstimmt: Kriterien als erfüllt beurteilt',
      ergebnis: 'Kriterien erfüllt',
      begruendung: 'SL-DJ klinisch unauffällig',
    })
    expect(b.therapeut).toBe('PR')
    expect(b.phase.uebersteuert).toBe('Re-Arthroskopie')
    const sldj = b.bloecke.flatMap((x) => x.tests).find((x) => x.test.id === 'sl_dj')!
    expect(sldj.klinischAnders).toEqual({ urteil: 'als erfüllt beurteilt', begruendung: 'Sprungbild sauber' })
  })

  it('Verlaufstest hat keinen RTS-Vorschlag', () => {
    expect(arztBericht(patient, testungen[0]).rts).toBeNull()
  })

  it('Verlaufstabelle: Pflicht-Tests über alle Testungen bis zu dieser, Ampel als Zeichen', () => {
    const v = verlaufTabelle(patient, testungen, ende)
    expect(v.spalten.map((s) => s.phase)).toEqual(['Mitte', 'Spät', '> 9 Mo'])
    const ext = v.zeilen.find((z) => z.name === 'Knie-Extension (HHD)')!
    expect(ext.kriterium).toBe('LSI')
    expect(ext.werte[2].wert).toMatch(/✓$/)
    expect(ext.werte[0].wert).toMatch(/✗$/)
    // Spätere Testungen gehören nicht in einen früheren Bericht
    expect(verlaufTabelle(patient, testungen, testungen[0]).spalten).toHaveLength(1)
  })

  it('Verlaufstabelle: Ziel je Zelle nur, wenn es sich zwischen den Phasen ändert; Kriterium nicht doppelt', () => {
    const v = verlaufTabelle(patient, testungen, ende)
    const cmj = v.zeilen.find((z) => z.name === 'CMJ')!
    expect(cmj.werte.map((w) => w.ziel)).toEqual(['< 13,4 %', '< 13,4 %', '< 10 %'])
    expect(cmj.werte[1].wert).toBe('11,7 % ✓')
    const ext = v.zeilen.find((z) => z.name === 'Knie-Extension (HHD)')!
    expect(ext.werte.every((w) => w.ziel === null)).toBe(true)
    expect(v.zeilen.find((z) => z.name === 'Erguss (Stroke-Test)')?.kriterium).toBe('')
  })

  it('Verlaufstabelle: bei mehr als 6 Testungen bleibt die erste, dazu die letzten 5', () => {
    const viele = Array.from({ length: 8 }, (_, i) => ({ ...testungen[0], id: `x${i}`, datum: `2026-0${i + 1}-01` }))
    const v = verlaufTabelle(patient, viele, viele[7])
    expect(v.spalten.map((s) => s.datum)).toEqual(['01.01.2026', '01.04.2026', '01.05.2026', '01.06.2026', '01.07.2026', '01.08.2026'])
  })

  it('Zeiten in Worten statt LSI; H/Q aus Kraft mit Hinweis auf den Hebelarm', () => {
    expect(zeitVergleich(113.3)).toBe('betroffen 13,3 % länger')
    expect(zeitVergleich(94)).toBe('betroffen 6 % kürzer')
    expect(zeitVergleich(100.02)).toBe('betroffen gleich lang')
    const tests = arztBericht(patient, ende, auswahlBereinigen(undefined)).bloecke.flatMap((x) => x.tests)
    expect(tests.find((t) => t.test.id === 'sl_dj')!.meloq.find((m) => m.name === 'Kontaktzeit')?.vergleich).toBe('betroffen 13,3 % länger')
    expect(tests.find((t) => t.test.id === 'hhd_knie_flex')!.zusatz.join(' ')).toMatch(/aus Kraft – gleicher Hebelarm angenommen/)
  })

  it('Nachvollziehbarkeit: Protokoll, Richtung, N/kg je Seite, Anhang mit Protokollen und Rohdaten', () => {
    const b = arztBericht(patient, ende, auswahlBereinigen(undefined))
    const tests = b.bloecke.flatMap((x) => x.tests)
    const ext = tests.find((t) => t.test.id === 'hhd_knie_ext')!
    expect(ext.seiten).toBe('gesund 8,3 · betroffen 7,8 N/kg (66 / 62 kg)')
    expect(ext.protokoll.map((p) => p.text)).toEqual(['Winkel 60°', 'Eingabe in kg'])
    const cmj = tests.find((t) => t.test.id === 'cmj')!
    expect(cmj.kriterien.find((k) => k.bezeichnung === 'Net-Impulse-Asymmetrie')?.wertHinweis).toBe('betroffene Seite stärker')
    expect(cmj.meloq.find((m) => m.name.startsWith('Peak Force'))).toMatchObject({ wert: expect.stringMatching(/^L \(betroffen\) 98 · R 92 kg/), vergleich: 'Asymmetrie 6,1 % – betroffene Seite stärker' })
    expect(b.protokolle.map((p) => p.name)).toEqual(expect.arrayContaining(['Allgemein', 'Knie-Extension (HHD)', 'SL-Drop-Jump']))
    expect(b.rohdaten.map((r) => r.id)).toEqual(expect.arrayContaining(['hhd_knie_ext', 'cmj', 'single_hop', 'imtp']))
    expect(b.rohdaten.some((r) => r.id === 'sl_bridge')).toBe(false)
  })

  it('Überblick: Pflicht-Tests gezählt – Verlaufstest mit eigenem Stand, Endtestung mit Zählzeile', () => {
    const mitte = arztBericht(patient, testungen[0])
    expect(mitte.stand.titel).toBe('Stand der Phase Mitte')
    expect(mitte.stand.zeile).toMatch(/^\d+ von \d+ Pflicht-Tests erfüllt · \d+ nicht erfüllt/)
    expect(mitte.stand.offen.some((o) => o.startsWith('Knie-Extension (HHD): '))).toBe(true)
    const e = arztBericht(patient, ende)
    expect(e.stand.zeile).toMatch(/ von \d+ Pflicht-Tests erfüllt · 1 nicht erfüllt$/)
    expect(e.stand.offen).toEqual(['SL-Drop-Jump: LSI Sprunghöhe 89,7 % – Ziel ≥ 90 %'])
  })

  it('Verlaufstabelle: Seitenwerte je Zelle und Veränderung zur vorigen Testung', () => {
    const v = verlaufTabelle(patient, testungen, ende)
    const ext = v.zeilen.find((z) => z.name === 'Knie-Extension (HHD)')!
    expect(ext.werte[2].seiten).toBe('b 7,8 · g 8,3 N/kg')
    expect(ext.werte[0].seiten).toBe('b 4,9 · g 7,1 N/kg')
    expect(ext.veraenderung).toBe('+10,6 Pkt. · betroffen +1,4 N/kg')
    const cmj = v.zeilen.find((z) => z.name === 'CMJ')!
    expect(cmj.veraenderung).toBe('−4 Pkt.')
    // nur ein Wert in früheren Testungen → keine Veränderung
    expect(v.zeilen.find((z) => z.name === 'SL-Drop-Jump')!.veraenderung).toBeNull()
  })

  it('Normdaten nur bei passender Gruppe; Vorverletzung als eigene Zeile ohne Ampel', () => {
    const tests = arztBericht(patient, ende).bloecke.flatMap((x) => x.tests)
    expect(tests.find((t) => t.test.id === 'cmj')!.normdaten).toMatch(/^Typisch nach VKB-OP \(12 Mo, männlich 20–30\): Sprunghöhe: 30,7 cm .*Vergleich ohne Verletzung/)
    expect(tests.find((t) => t.test.id === 'hhd_knie_ext')!.normdaten).toBeNull()
    const ohneGeschlecht = arztBericht({ ...patient, geschlecht: '' }, ende).bloecke.flatMap((x) => x.tests)
    expect(ohneGeschlecht.find((t) => t.test.id === 'cmj')!.normdaten).toBeNull()

    const mitVor = { ...ende, eingaben: { ...ende.eingaben, single_hop: { ...ende.eingaben.single_hop, vor: '160' } } }
    const hop = arztBericht(patient, mitVor).bloecke.flatMap((x) => x.tests).find((t) => t.test.id === 'single_hop')!
    expect(hop.kriterien.find((k) => k.bezeichnung === 'LSI zur Vorverletzung')).toMatchObject({ wert: '95,0 %', bewertung: { ampel: null } })
    expect(hop.zusatz.join(' ')).not.toMatch(/Vorverletzung/)
    expect(patBericht(patient, mitVor).zeilen.find((z) => z.id === 'single_hop')?.vorverletzung).toBe(95)
  })

  it('fehlendes Körpergewicht heißt nicht „nicht gemessen“', () => {
    const ohne = { ...ende, koerpergewichtKg: '' }
    const b = arztBericht(patient, ohne)
    const ext = b.bloecke.flatMap((x) => x.tests).find((t) => t.test.id === 'hhd_knie_ext')!
    expect(ext.kriterien.find((k) => k.bezeichnung === 'Kraft relativ')?.bewertung).toEqual({ ampel: null, text: 'Körpergewicht fehlt – keine N/kg' })
    expect(b.rts?.wasFehlt).toContain('Knie-Extension (HHD): Körpergewicht fehlt – keine N/kg bzw. Ns/kg')
    expect(patBericht(patient, ohne).wasFehlt).toContain('Kraft Oberschenkel vorne (Knie strecken): Körpergewicht fehlt noch für die Auswertung')
  })
})

describe('Pat./Trainer-Bericht', () => {
  it('nur Output-Werte (ohne Klinik, Fragebögen, Driver) mit Ampel als Text', () => {
    const b = patBericht(patient, ende)
    const ids = b.zeilen.map((z) => z.id)
    expect(ids).not.toContain('erguss')
    expect(ids).not.toContain('acl_rsi')
    expect(ids).toContain('single_hop')
    expect(JSON.stringify(b)).not.toMatch(/Net Impulse|Asymmetrie/)
    const cmj = b.zeilen.find((z) => z.id === 'cmj')!
    expect(cmj.wert).toBe('34,6 cm')
    const sldj = b.zeilen.find((z) => z.id === 'sl_dj')!
    expect(sldj.name).toBe('Niedersprung einbeinig (Höhe)')
    expect(sldj.bewertung).toEqual({ ampel: 'gelb', text: 'knapp' })
    expect(b.klinik).toMatch(/in Ordnung/)
  })

  it('Spinnennetz: Achsen nur für Tests mit Seitenvergleich', () => {
    const b = patBericht(patient, ende)
    expect(b.netz.length).toBeGreaterThanOrEqual(3)
    expect(b.netz.map((a) => a.name)).not.toContain('Sprung beidbeinig')
    expect(b.netz.find((a) => a.name === 'Niedersprung')).toEqual({ name: 'Niedersprung', lsi: 89.7, ampel: 'gelb' })
  })

  it('Unterschied zwischen den Beinen als eigene Zeile, auch unter „Was fehlt noch?“; keine leeren Zeilen', () => {
    const cmj = patBericht(patient, ende).zeilen.find((z) => z.id === 'cmj:verteilung')!
    // DEMO-1990: betroffen links, Net Impulse L 15,6 > R 14,4
    expect(cmj).toMatchObject({ name: 'Sprung beidbeinig – Verteilung auf beide Beine', wert: '7,7 % – betroffenes Bein stärker', wertArt: 'unterschied', bewertung: { ampel: 'gruen' } })
    const mitte = patBericht(patient, testungen[0])
    expect(mitte.zeilen.find((z) => z.id === 'hop_platte:verteilung')?.wert).toMatch(/^14/)
    expect(mitte.zeilen.some((z) => z.id === 'hop_platte')).toBe(false)
    expect(mitte.zeilen.every((z) => z.wert !== '')).toBe(true)
    expect(mitte.wasFehlt).toContain('Sprung beidbeinig – Verteilung auf beide Beine: 19,2 % Unterschied zwischen den Beinen – Ziel: unter 13,4 %')
    // SL-CMJ: Impuls-Asymmetrie bleibt als Driver-Wert draußen
    expect(patBericht(patient, ende).zeilen.some((z) => z.id === 'sl_cmj:verteilung')).toBe(false)
  })

  it('„Was fehlt noch?“ in Alltagssprache; Ergebnis erst nach Abschluss', () => {
    const b = patBericht(patient, ende)
    expect(b.wasFehlt).toEqual(['Niedersprung einbeinig (Höhe): das betroffene Bein schafft 89,7 % des gesunden – Ziel: mindestens 90 %'])
    expect(b.hinweise[0]).toMatch(/Vertrauen ins Knie/)
    expect(b.ergebnis).toBeNull()
    expect(patBericht(patient, abgeschlossen(ende)).ergebnis).toBe('Kriterien erfüllt')
    expect(JSON.stringify(b)).not.toMatch(/Freigabe/i)
  })

  it('Verlaufstest: „Was fehlt noch?“ ohne Zeitregel, kein Ergebnis', () => {
    const b = patBericht(patient, testungen[0])
    expect(b.wasFehlt.some((w) => w.startsWith('Zeit'))).toBe(false)
    expect(b.wasFehlt.some((w) => w.startsWith('Kraft Oberschenkel vorne'))).toBe(true)
    expect(b.ergebnis).toBeNull()
  })

  it('Verlaufstest: Phasenziele statt Mängelliste, nicht Getestetes in einer Zeile (Audit Punkt 15)', () => {
    const mitte = patBericht(patient, testungen[0])
    expect(mitte.wasFehltTitel).toBe('Ziele dieser Phase – noch offen')
    expect(mitte.erreicht).toBe('Schon erreicht: 3 von 12 Zielen dieser Phase')
    expect(mitte.wasFehlt).toHaveLength(7)
    expect(mitte.wasFehlt.at(-1)).toBe('Noch nicht (vollständig) getestet: 3 Sprünge einbeinig, 3 Sprünge einbeinig über eine Linie, 6 m einbeinig hüpfen (Zeit)')
    const b = patBericht(patient, ende)
    expect(b.wasFehltTitel).toBe('Was fehlt noch?')
    expect(b.erreicht).toBe('Schon erreicht: 12 von 13 Pflicht-Zielen')
  })

  it('Fortschritt: LSI der vorigen Testung, nur wo es beide gibt (Audit Punkt 16)', () => {
    const b = patBericht(patient, ende, testungen)
    expect(b.vorigeDatum).toBe('02.05.2026')
    expect(b.zeilen.find((z) => z.id === 'hhd_knie_ext')?.vorige).toBe(83.3)
    // SL-Drop-Jump gab es bei „Spät“ nicht
    expect(b.zeilen.find((z) => z.id === 'sl_dj')?.vorige).toBeNull()
    expect(b.zeilen.find((z) => z.id === 'cmj:verteilung')?.vorige).toBeNull()
    // erste Testung: kein Vergleich
    const erste = patBericht(patient, testungen[0], testungen)
    expect(erste.vorigeDatum).toBeNull()
    expect(erste.zeilen.every((z) => z.vorige === null)).toBe(true)
    // ohne Liste wie bisher
    expect(patBericht(patient, ende).zeilen.every((z) => z.vorige === null)).toBe(true)
  })
})

describe('Bausteine', () => {
  it('Bewertung immer mit Text, auch bei Warnung und fehlendem Wert', () => {
    const k = { id: 'score', bezeichnung: 'Score', art: 'absolut', status: 'warnung', werte: {}, quelle: '' } as const
    expect(bewertungText({ kriterium: k, zustand: 'bewertet', ampel: 'gelb', zaehlt: false })).toEqual({ ampel: 'gelb', text: 'Warnung' })
    expect(bewertungText({ kriterium: k, zustand: 'offen', zaehlt: false })).toEqual({ ampel: null, text: 'nicht gemessen' })
  })

  it('Alltagssprache für Absolutwerte', () => {
    const k = { id: 'relativ', bezeichnung: 'Kraft relativ', art: 'absolut', vergleich: '>', einheit: 'N/kg', nachkomma: 1, status: 'pflicht', werte: {}, quelle: '' } as const
    expect(kriteriumAlltag({ kriterium: k, zustand: 'bewertet', ampel: 'rot', wert: 6.8, schwelle: { wert: 7.5, uebernommen: false, vonPhase: 'spaet' }, zaehlt: true })).toBe(
      'Kraft pro kg Körpergewicht 6,8 N/kg – Ziel: über 7,5 N/kg',
    )
  })
})
