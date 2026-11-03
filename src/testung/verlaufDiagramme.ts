// Aufbereitung einer Verlaufsgröße für LinienDiagramm (Seite des Kürzels und Arztbericht).

import type { Testung } from '../db'
import { phaseNach } from '../katalog'
import type { Patient } from '../patienten/stammdaten'
import type { Reihe } from './LinienDiagramm'
import { fehlendeMessungen, kriterienFuer, PHASEN_MONATE, verlaufsDaten, zielkorridor, type VerlaufOption } from './verlauf'
import { normenFuer, spannenFuer } from './verlaufZusatz'

/** Farben aus dem Designsystem: Blau = betroffen (durchgezogen), Türkis = gesund (gestrichelt). */
export const REIHE_GESUND: Reihe = { name: 'gesund', farbe: 'var(--seite-gesund)', gestrichelt: true }
export const REIHE_BETROFFEN: Reihe = { name: 'betroffen', farbe: 'var(--seite-betroffen)' }

export function verlaufsDiagramme(patient: Pick<Patient, 'opDatum' | 'geschlecht'> & Partial<Pick<Patient, 'seite' | 'geburtsjahr'>>, testungen: readonly Testung[], option: VerlaufOption) {
  const punkte = verlaufsDaten(patient, testungen, option)
  // Spanne der Versuche und Normdaten (Visualisierung Stufe 1) – nur zum Lesen, ohne Einfluss auf Ampel und Korridor
  const nachId = new Map(testungen.map((t) => [t.id, t]))
  const spannen = new Map(punkte.map((p) => [p.testungId, spannenFuer(option, nachId.get(p.testungId)!, patient)]))
  const normen = normenFuer(option, patient)
  const fehlend = fehlendeMessungen(patient, testungen, option).map((f) => ({ datum: f.datum, monate: f.genau, phase: phaseNach(f.phase).name }))
  const k = kriterienFuer(option)
  const basis = (p: (typeof punkte)[number]) => ({ datum: p.datum, monate: p.genau, phase: phaseNach(p.phase).name })

  const diagramme = [
    {
      titel: option.name,
      einheit: option.einheit,
      reihen: option.seiten ? [REIHE_GESUND, REIHE_BETROFFEN] : [{ name: 'Wert', farbe: REIHE_BETROFFEN.farbe }],
      punkte: punkte.map((p) => {
        const sp = spannen.get(p.testungId)!
        return { ...basis(p), werte: option.seiten ? [p.gesund, p.betroffen] : [p.wert], ampel: p.ampelWert, spannen: option.seiten ? [sp.gesund, sp.betroffen] : [sp.wert] }
      }),
      normen: normen?.erstes.length ? normen.erstes : undefined,
      normText: normen?.erstes.length ? normen.text : undefined,
      fehlend,
      korridor: zielkorridor(k.wert),
      bewertet: k.wert?.bezeichnung,
      hinweis: option.hinweis,
      phasen: PHASEN_MONATE,
      abNull: true,
      nachkomma: option.einheit === 'N/kg' ? 2 : 1,
    },
  ]
  if (option.zweites && punkte.some((p) => p.zweites !== null)) {
    const lsi = option.zweites.name === 'LSI'
    diagramme.push({
      titel: option.zweites.name,
      einheit: '%',
      reihen: [{ name: lsi ? 'LSI (betroffen zu gesund)' : 'Asymmetrie', farbe: REIHE_BETROFFEN.farbe }],
      punkte: punkte.filter((p) => p.zweites !== null).map((p) => ({ ...basis(p), werte: [p.zweites], ampel: p.ampelZweites, spannen: [spannen.get(p.testungId)!.zweites] })),
      normen: normen?.zweites.length ? normen.zweites : undefined,
      normText: normen?.zweites.length ? normen.text : undefined,
      fehlend,
      korridor: zielkorridor(k.zweites),
      bewertet: k.zweites?.bezeichnung,
      hinweis: option.hinweis,
      phasen: PHASEN_MONATE,
      abNull: !lsi,
      nachkomma: 1,
    })
  }
  return { punkte, diagramme }
}
