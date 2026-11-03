import { beforeEach, describe, expect, it } from 'vitest'
import { beispielAnlegen } from '../beispiel'
import { db, type Testung } from '../db'
import type { Patient } from '../patienten/stammdaten'
import { testAbdeckung } from './abdeckung'
import { leistungsprofil } from './profil'

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
