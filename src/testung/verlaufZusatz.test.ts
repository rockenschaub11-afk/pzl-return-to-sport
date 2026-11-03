import { beforeEach, describe, expect, it } from 'vitest'
import { beispielAnlegen } from '../beispiel'
import { db, type Testung } from '../db'
import type { Patient } from '../patienten/stammdaten'
import { VERLAUF_OPTIONEN } from './verlauf'
import { verlaufsDiagramme } from './verlaufDiagramme'
import { normenFuer, spannenFuer } from './verlaufZusatz'

let patient: Patient
let testungen: Testung[]
const option = (id: string) => VERLAUF_OPTIONEN.find((o) => o.id === id)!

beforeEach(async () => {
  await db.patienten.clear()
  await db.testungen.clear()
  const id = await beispielAnlegen()
  patient = (await db.patienten.get(id))!
  testungen = (await db.testungen.where('patientId').equals(id).toArray()).sort((a, b) => a.datum.localeCompare(b.datum))
})

describe('Spanne der Versuche im Verlauf', () => {
  it('Kraft in N/kg je Seite, LSI aus allen Kombinationen', () => {
    const s = spannenFuer(option('hhd_knie_ext'), testungen[2], patient)
    expect(s.gesund![0]).toBeCloseTo((64 * 9.81) / 78)
    expect(s.gesund![1]).toBeCloseTo((66 * 9.81) / 78)
    expect(s.betroffen![0]).toBeCloseTo((60 * 9.81) / 78)
    expect(s.zweites![0]).toBeCloseTo((60 / 66) * 100)
  })

  it('Strategy-Werte und Tests mit einem Wert haben keine Spanne', () => {
    expect(spannenFuer(option('sl_cmj:ct'), testungen[2], patient)).toEqual({ gesund: null, betroffen: null, wert: null, zweites: null })
    expect(spannenFuer(option('sl_bridge'), testungen[2], patient).zweites).toBeNull()
  })

  it('ändert keinen Wert und keine Ampel im Diagramm', () => {
    const d = verlaufsDiagramme(patient, testungen, option('hhd_knie_ext')).diagramme
    const letzte = d[0].punkte.at(-1)!
    expect(letzte.werte[1]).toBeCloseTo((62 * 9.81) / 78)
    expect(letzte.ampel).toBe('gruen')
    expect(letzte.spannen?.[1]).not.toBeNull()
  })
})

describe('Normdaten im Verlauf', () => {
  it('nur bei passender Gruppe, je Seite an ihrem Zeitpunkt, ohne Vergleichsgruppe', () => {
    const n = normenFuer(option('sl_cmj'), patient)!
    expect(n.erstes).toContainEqual({ monate: 6, reihe: 1, mittel: 13.1, von: undefined, bis: undefined })
    expect(n.erstes).toContainEqual({ monate: 6, reihe: 0, mittel: 16.7, von: undefined, bis: undefined })
    expect(n.text).toMatch(/männlich 20–30/)
    expect(n.text).toMatch(/ohne Einfluss auf die Ampel/)
  })

  it('fehlt Geschlecht oder Geburtsjahr, gibt es keine Normdaten', () => {
    expect(normenFuer(option('sl_cmj'), { ...patient, geburtsjahr: '' })).toBeNull()
    expect(normenFuer(option('sl_cmj'), { ...patient, geschlecht: 'divers' })).toBeNull()
  })

  it('Strategy-Werte und Einheiten ohne Normdaten bleiben leer', () => {
    expect(normenFuer(option('sl_cmj:ct'), patient)).toBeNull()
    expect(normenFuer(option('hhd_knie_ext'), patient)).toBeNull()
  })
})
