import { describe, expect, it } from 'vitest'
import { KATALOG } from '../katalog'
import { pruefeKatalog } from '../katalog/pruefen'
import { ERFASSUNG } from './erfassung'

// Stand vor Audit W5 (Erfassungstyp lag im Code) – der Katalog muss genau dasselbe ergeben.
const VORHER = {
  "erguss": {
    "typ": "auswahl"
  },
  "rom_extension": {
    "typ": "defizit"
  },
  "rom_flexion": {
    "typ": "flexion"
  },
  "slr": {
    "typ": "janein"
  },
  "hhd_knie_ext": {
    "typ": "kraft"
  },
  "hhd_knie_flex": {
    "typ": "kraft"
  },
  "hhd_knie_flex_60": {
    "typ": "kraft"
  },
  "hhd_knie_flex_30": {
    "typ": "kraft"
  },
  "hhd_hueft_abd": {
    "typ": "kraft"
  },
  "plantarflexion": {
    "typ": "kraft"
  },
  "cmj": {
    "typ": "cmj"
  },
  "sl_cmj": {
    "typ": "sl_sprung"
  },
  "sl_dj": {
    "typ": "sl_dj"
  },
  "imtp": {
    "typ": "imtp"
  },
  "single_hop": {
    "typ": "versuche",
    "einheit": "cm"
  },
  "triple_hop": {
    "typ": "versuche",
    "einheit": "cm"
  },
  "crossover_hop": {
    "typ": "versuche",
    "einheit": "cm"
  },
  "timed_hop": {
    "typ": "versuche",
    "einheit": "s"
  },
  "side_hop": {
    "typ": "einzeln",
    "einheit": "Wdh.",
    "kriterium": "wdh"
  },
  "sl_bridge": {
    "typ": "einzeln",
    "einheit": "Wdh.",
    "kriterium": "wdh"
  },
  "sl_calf_raise": {
    "typ": "einzeln",
    "einheit": "Wdh.",
    "kriterium": "wdh"
  },
  "sl_sit_to_stand": {
    "typ": "einzeln",
    "einheit": "Wdh.",
    "kriterium": "wdh"
  },
  "sl_squat": {
    "typ": "einzeln",
    "einheit": "°",
    "kriterium": "winkel"
  },
  "sl_balance": {
    "typ": "einzeln",
    "einheit": "mm",
    "kriterium": "schwankweg"
  },
  "bridge_beidbeinig": {
    "typ": "direkt",
    "felder": [
      {
        "kriterium": "wdh",
        "label": "Wiederholungen",
        "einheit": "Wdh."
      }
    ]
  },
  "calf_raise_beidbeinig": {
    "typ": "direkt",
    "felder": [
      {
        "kriterium": "wdh",
        "label": "Wiederholungen",
        "einheit": "Wdh."
      }
    ]
  },
  "kniebeuge_asym": {
    "typ": "direkt",
    "felder": [
      {
        "kriterium": "asymmetrie",
        "label": "Asymmetrie (Meloq)",
        "einheit": "%"
      }
    ]
  },
  "hop_platte": {
    "typ": "direkt",
    "felder": [
      {
        "kriterium": "impuls_asymmetrie",
        "label": "Impuls-Asymmetrie (Meloq)",
        "einheit": "%"
      }
    ]
  },
  "dj_bilateral": {
    "typ": "direkt",
    "felder": [
      {
        "kriterium": "hoehe",
        "label": "Sprunghöhe (bester Versuch)",
        "einheit": "cm"
      },
      {
        "kriterium": "asymmetrie",
        "label": "Asymmetrie (Meloq)",
        "einheit": "%"
      }
    ]
  },
  "acl_rsi": {
    "typ": "score"
  },
  "ikdc": {
    "typ": "score"
  },
  "tampa": {
    "typ": "score"
  },
  "koos": {
    "typ": "koos"
  }
}

describe('Erfassungstyp aus tests.json (Audit W5)', () => {
  it('ergibt genau die bisherige Zuordnung', () => {
    expect(ERFASSUNG).toEqual(VORHER)
  })

  it('meldet einen unbekannten Typ und eine fehlende Einheit', () => {
    const tests = KATALOG.tests.map((t) => (t.id === 'single_hop' ? { ...t, erfassung: { typ: 'gibtsnicht' } } : t.id === 'sl_bridge' ? { ...t, erfassung: { typ: 'einzeln', einheit: '', kriterium: 'wdh' } } : t))
    const fehler = pruefeKatalog({ ...KATALOG, tests } as typeof KATALOG)
    expect(fehler).toContainEqual(expect.stringMatching(/single_hop.*Erfassung/))
    expect(fehler).toContainEqual(expect.stringMatching(/sl_bridge.*einheit/))
  })
})
