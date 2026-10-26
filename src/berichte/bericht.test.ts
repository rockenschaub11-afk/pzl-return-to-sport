import { beforeEach, describe, expect, it } from 'vitest'
import { beispielAnlegen } from '../beispiel'
import { db, type Testung } from '../db'
import type { Patient } from '../patienten/stammdaten'
import { auswahlBereinigen } from '../testung/meloqAuswahl'
import { arztBericht, bewertungText, kriteriumAlltag, patBericht, verlaufTabelle } from './bericht'

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
    expect(ext.werte[2]).toMatch(/✓$/)
    expect(ext.werte[0]).toMatch(/✗$/)
    // Spätere Testungen gehören nicht in einen früheren Bericht
    expect(verlaufTabelle(patient, testungen, testungen[0]).spalten).toHaveLength(1)
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
    expect(b.netz.find((a) => a.name === 'Niedersprung')?.lsi).toBe(89.7)
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
