import { beforeEach, describe, expect, it } from 'vitest'
import { beispielAnlegen, beispielLoeschen } from './beispiel'
import { db } from './db'
import { phasenStand, werteAus } from './testung/ablauf'
import { rtsVorschlag } from './testung/rts'
import { verfuegbareOptionen } from './testung/verlauf'

describe('Beispiel-Pat. DEMO-1990', () => {
  beforeEach(async () => {
    await db.patienten.clear()
    await db.testungen.clear()
  })

  it('legt Kürzel und drei Testungen an – Endtestung zeigt genau einen offenen Punkt', async () => {
    const id = await beispielAnlegen()
    const p = (await db.patienten.get(id))!
    const t = await db.testungen.where('patientId').equals(id).sortBy('datum')
    expect(t.map((x) => phasenStand(x, p.opDatum).phase)).toEqual(['mitte', 'spaet', 'rtc'])

    const ende = t[2]
    const v = rtsVorschlag(ende, p, werteAus(ende, 'rtc', p.geschlecht), 'rtc')
    expect(v.erfuellt).toBe(false)
    expect(v.wasFehlt).toEqual(['SL-Drop-Jump: LSI Sprunghöhe 89,7 % – Ziel ≥ 90 %'])
    expect(v.aclRsiWarnung).not.toBeNull()
    expect(verfuegbareOptionen(p, t).length).toBeGreaterThan(5)
  })

  it('gibt es nur einmal und lässt sich wieder löschen', async () => {
    await beispielAnlegen()
    await expect(beispielAnlegen()).rejects.toThrow('gibt es schon')
    expect(await beispielLoeschen()).toBe(true)
    expect(await db.testungen.count()).toBe(0)
  })
})
