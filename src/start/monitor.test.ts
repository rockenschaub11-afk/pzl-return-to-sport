import { describe, expect, it } from 'vitest'
import { ausloesen, erzeugeEreignis, neuerKanal, planen, vorbereiten, wertImKanal, zufallMitSamen, type KanalArt } from './monitor'

const ARTEN: KanalArt[] = ['cmj', 'ext', 'dj']

describe('Live-Monitor', () => {
  it('beginnt und endet jedes Ereignis im Ruhewert des Kanals', () => {
    const z = zufallMitSamen(1)
    for (const art of ARTEN) {
      const kanal = neuerKanal(art)
      const e = erzeugeEreignis(art, 0, z)
      e.linien.forEach((linie, i) => {
        expect(linie[0][1]).toBe(kanal.ruhe[i])
        expect(linie[linie.length - 1][1]).toBe(kanal.ruhe[i])
      })
    }
  })

  it('bleibt mit allen Werten im Band des Kanals', () => {
    const z = zufallMitSamen(5)
    for (const art of ARTEN) {
      const kanal = neuerKanal(art)
      for (let i = 0; i < 40; i++) {
        for (const linie of erzeugeEreignis(art, 0, z).linien) {
          for (const [, v] of linie) {
            expect(v).toBeGreaterThanOrEqual(0)
            expect(v).toBeLessThanOrEqual(kanal.max)
          }
        }
      }
    }
  })

  it('zeigt beim CMJ eine Flugphase ohne Kraft', () => {
    const kanal = neuerKanal('cmj')
    ausloesen(kanal, 10, zufallMitSamen(2))
    expect(wertImKanal(kanal, 0, 10)).toBe(1) // Stand
    expect(wertImKanal(kanal, 0, 10.9)).toBe(0) // in der Luft
    expect(wertImKanal(kanal, 1, 10.9)).toBe(0)
  })

  it('plant laufend neue Ereignisse und vergisst alte', () => {
    const z = zufallMitSamen(3)
    const kanal = neuerKanal('ext')
    vorbereiten(kanal, 0, 4, z)
    for (let t = 0; t <= 60; t += 0.1) planen(kanal, t, 4, z)
    expect(kanal.ereignisse.length).toBeGreaterThan(0)
    expect(kanal.ereignisse.every((e) => e.start + e.dauer >= 60 - 4)).toBe(true)
    expect(kanal.naechstes).toBeGreaterThan(60)
  })

  it('füllt den Monitor schon beim Öffnen', () => {
    const kanal = neuerKanal('cmj')
    vorbereiten(kanal, 100, 4, zufallMitSamen(4))
    expect(kanal.ereignisse.some((e) => e.start < 100)).toBe(true)
  })

  it('löst beim Klick sofort einen Sprung aus – oder direkt nach dem laufenden', () => {
    const z = zufallMitSamen(6)
    const kanal = neuerKanal('cmj')
    ausloesen(kanal, 20, z)
    expect(kanal.ereignisse.at(-1)!.start).toBe(20)
    const ende = 20 + kanal.ereignisse.at(-1)!.dauer
    ausloesen(kanal, 20.5, z)
    expect(kanal.ereignisse.at(-1)!.start).toBeCloseTo(ende + 0.15, 6)
  })

  it('Ruhewert, wenn nichts passiert', () => {
    const kanal = neuerKanal('dj')
    expect(wertImKanal(kanal, 0, 5)).toBe(0)
  })
})
