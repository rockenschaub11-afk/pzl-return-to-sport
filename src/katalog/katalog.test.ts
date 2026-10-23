import { describe, expect, it } from 'vitest'
import { KATALOG, KATALOG_FEHLER } from '.'
import { pruefeKatalog } from './pruefen'
import type { Katalog } from './typen'

const kopie = (): Katalog => structuredClone(KATALOG)

describe('Testkatalog (config/)', () => {
  it('ist fehlerfrei', () => {
    expect(KATALOG_FEHLER).toEqual([])
  })

  it('enthält alle Tests der Endtestung (ENTSCHEIDUNGEN 4)', () => {
    const endtest = KATALOG.tests.filter((t) => t.inEndtestung).map((t) => t.id)
    expect(endtest).toEqual(
      expect.arrayContaining([
        'erguss', 'rom_extension', 'rom_flexion', 'slr', 'hhd_knie_ext', 'hhd_knie_flex', 'hhd_hueft_abd', 'plantarflexion',
        'cmj', 'sl_cmj', 'sl_dj', 'imtp', 'single_hop', 'triple_hop', 'crossover_hop', 'timed_hop', 'side_hop',
        'sl_calf_raise', 'sl_bridge', 'sl_sit_to_stand', 'acl_rsi', 'ikdc', 'koos', 'tampa',
      ]),
    )
  })

  it('jedes Kriterium hat eine Quelle', () => {
    for (const t of KATALOG.tests) for (const k of t.kriterien) expect(k.quelle.length, `${t.id} → ${k.id}`).toBeGreaterThan(0)
  })
})

describe('Prüfung beim Start findet Fehler', () => {
  it('unbekanntes Protokoll', () => {
    const k = kopie()
    k.tests[0].protokoll = 'gibt_es_nicht'
    expect(pruefeKatalog(k).join()).toContain('Protokoll „gibt_es_nicht“ gibt es nicht')
  })

  it('Tippfehler in einer Phase', () => {
    const k = kopie()
    ;(k.tests[4].kriterien[0].werte as Record<string, number>).spät = 7.5
    expect(pruefeKatalog(k).join()).toContain('unbekannte Phase „spät“')
  })

  it('Schwelle ist keine Zahl', () => {
    const k = kopie()
    ;(k.tests[4].kriterien[0].werte as Record<string, unknown>).mitte = '7,0'
    expect(pruefeKatalog(k).join()).toContain('Schwelle für mitte ist keine Zahl')
  })

  it('Pflicht-Kriterium ohne Schwelle', () => {
    const k = kopie()
    k.tests[4].kriterien[0].werte = {}
    expect(pruefeKatalog(k).join()).toContain('pflicht ohne Schwelle')
  })

  it('doppelte Test-id', () => {
    const k = kopie()
    k.tests[1].id = k.tests[0].id
    expect(pruefeKatalog(k).join()).toContain('doppelte id')
  })

  it('fehlende Quelle', () => {
    const k = kopie()
    k.tests[0].kriterien[0].quelle = ''
    expect(pruefeKatalog(k).join()).toContain('Quelle fehlt')
  })
})
