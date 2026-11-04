import { beforeEach, describe, expect, it } from 'vitest'
import { beispielAnlegen } from '../beispiel'
import { db, type Testung } from '../db'
import type { Patient } from '../patienten/stammdaten'
import { testAbdeckung } from './abdeckung'
import { leistungsprofil } from './profil'
import { arztBericht, verlaufTabelle } from '../berichte/bericht'
import { auswahlBereinigen } from './meloqAuswahl'

let patient: Patient
let testungen: Testung[]

beforeEach(async () => {
  await db.patienten.clear()
  await db.testungen.clear()
  const id = await beispielAnlegen()
  patient = (await db.patienten.get(id))!
  testungen = (await db.testungen.where('patientId').equals(id).toArray()).sort((a, b) => a.datum.localeCompare(b.datum))
})

const zeile = (a: ReturnType<typeof testAbdeckung>, id: string) => a.bloecke.flatMap((b) => b.zeilen).find((z) => z.id === id)!

describe('Testabdeckung', () => {
  it('Spalten nach Datum, Zelle = Status wie im Kopf der Testkarte', () => {
    const a = testAbdeckung(patient, [...testungen].reverse())
    expect(a.spalten.map((s) => s.datum)).toEqual(testungen.map((t) => t.datum))
    expect(zeile(a, 'hhd_knie_ext').zellen.map((z) => (z.zustand === 'gemessen' ? z.ampel : z.zustand))).toEqual(['rot', 'rot', 'gruen'])
  })

  it('unterscheidet „nicht gemessen“ (im Testset) und „gehört nicht zur Testung“', () => {
    const a = testAbdeckung(patient, testungen)
    expect(zeile(a, 'hhd_hueft_abd').zellen[0]).toEqual({ zustand: 'fehlt' })
    expect(zeile(a, 'sl_dj').zellen[0]).toEqual({ zustand: 'nicht_im_set' })
  })

  it('Tests, die in keiner Testung vorkommen, fehlen ganz', () => {
    const a = testAbdeckung(patient, [testungen[0]])
    expect(a.bloecke.flatMap((b) => b.zeilen).some((z) => z.id === 'sl_dj')).toBe(false)
  })
})

describe('Leistungsprofil', () => {
  it('Abstand zur Phasenschwelle in der Einheit des Tests, Ampel unverändert', () => {
    const p = leistungsprofil(patient, testungen[2]).flatMap((b) => b.zeilen)
    const ext = p.find((z) => z.id === 'hhd_knie_ext:relativ')!
    expect(ext).toMatchObject({ einheit: 'N/kg', wert: 7.8, schwelle: 7.5, abstand: 0.3, ampel: 'gruen', erfuellt: true })
    expect(p.find((z) => z.id === 'acl_rsi:score')).toMatchObject({ abstand: -3, ampel: 'gelb', status: 'Warnung' })
  })

  it('ohne LSI-Kriterien und ohne Kriterien ohne Schwelle', () => {
    const p = leistungsprofil(patient, testungen[2]).flatMap((b) => b.zeilen)
    expect(p.some((z) => z.id.endsWith(':lsi'))).toBe(false)
    expect(p.some((z) => z.id.startsWith('ikdc'))).toBe(false)
  })
})

describe('Motor Control in Bericht, Verlauf und Übersicht', () => {
  const mit = (t: Testung): Testung => ({
    ...t,
    motorControl: {
      mc_sl_squat: { b: { status: 'bewertet', kompensationen: ['knie:valgus', 'rumpf:seite'] }, g: { status: 'bewertet', kompensationen: [] }, text: 'mit Stab besser' },
      mc_dl_calf: { v: { status: 'nicht_durchfuehrbar', kompensationen: [] } },
    },
  })

  it('Arztbericht: Score je Seite, Segmente in Worten, Hinweis, Beobachtung', () => {
    const mc = arztBericht(patient, mit(testungen[2]), auswahlBereinigen(undefined)).motorControl
    expect(mc.map((x) => x.name)).toEqual(['Single Leg Squat', 'Calf Raise beidbeinig'])
    expect(mc[0]).toMatchObject({ hinweis: true, text: 'mit Stab besser' })
    expect(mc[0].seiten).toEqual([
      { titel: 'betroffen', score: '1/3', nichtDurchfuehrbar: false, kompensationen: ['Knie: Valgus', 'Hüfte / Rumpf: Rumpf weicht zur Seite aus'] },
      { titel: 'gesund', score: '3/3', nichtDurchfuehrbar: false, kompensationen: [] },
    ])
    expect(mc[1].seiten[0]).toMatchObject({ score: '0/3', nichtDurchfuehrbar: true })
  })

  it('Verlaufstabelle und Testabdeckung zeigen den Score als Text, ohne Ampel', () => {
    const alle = [testungen[0], testungen[1], mit(testungen[2])]
    const zeile = verlaufTabelle(patient, alle, alle[2]).zeilen.find((z) => z.name === 'Motor Control: Single Leg Squat')!
    expect(zeile.werte.map((w) => w.wert)).toEqual(['–', '–', 'b 1/3 · g 3/3'])
    expect(zeile.veraenderung).toBeNull()
    const a = testAbdeckung(patient, alle)
    const block = a.bloecke.find((b) => b.block === 'motor')!
    expect(a.bloecke.map((b) => b.block).slice(0, 2)).toEqual(['klinik', 'motor'])
    expect(block.zeilen.find((z) => z.id === 'mc_sl_squat')!.zellen[2]).toEqual({ zustand: 'motor', text: 'b 1/3 · g 3/3' })
  })

  it('ohne Bewertung kein Abschnitt, keine Zeile, kein Block', () => {
    expect(arztBericht(patient, testungen[2], auswahlBereinigen(undefined)).motorControl).toEqual([])
    expect(testAbdeckung(patient, testungen).bloecke.some((b) => b.block === 'motor')).toBe(false)
  })
})
