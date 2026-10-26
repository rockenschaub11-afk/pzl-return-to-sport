// Inhalte der Übersicht eines Kürzels (DESIGNKONZEPT 7): nur, was die App ohnehin rechnet –
// Stand der letzten Testung (Vorschlag/Entscheidung, „Was fehlt noch?“) und einzelne LSI-Werte.

import type { Testung } from '../db'
import { phaseNach } from '../katalog'
import type { Ampel } from '../rechnen/bewertung'
import { ART_TEXT, fortschritt, phasenStand, werteAus } from '../testung/ablauf'
import { endErgebnis, ENTSCHEIDUNG_TEXT } from '../testung/ErgebnisEntscheidung'
import { RTS_TEXT, rtsVorschlag } from '../testung/rts'
import { datumDeutsch, type Patient } from './stammdaten'

export interface LetzterStand {
  testung: Testung
  /** z. B. „Endtestung · > 9 Mo“ */
  titel: string
  /** Hauptaussage: Vorschlag bzw. Beurteilung (Endtestung) oder Art + Phase (Verlaufstest) */
  aussage: string
  /** woher die Aussage kommt, z. B. „Vorschlag der App, Endtestung vom 24.10.2026“ */
  herkunft: string
  endtestung: boolean
  abgeschlossen: boolean
  fortschritt: { erfasst: number; gesamt: number }
  /** offene Punkte – wie „Was fehlt noch?“, mit Ampel des Tests (null = noch nicht gemessen / Zeit) */
  offen: { text: string; ampel: Ampel | null }[]
  warnung: string | null
}

/** Neueste Testung zuerst (Datum, bei gleichem Datum die zuletzt angelegte). */
export const nachDatum = (testungen: readonly Testung[]) =>
  [...testungen].sort((x, y) => y.datum.localeCompare(x.datum) || y.angelegtAm.localeCompare(x.angelegtAm))

export function letzterStand(patient: Patient, testungen: readonly Testung[]): LetzterStand | null {
  const t = nachDatum(testungen)[0]
  if (!t) return null
  const ph = phasenStand(t, patient.opDatum)
  const a = werteAus(t, ph.phase, patient.geschlecht)
  const v = rtsVorschlag(t, patient, a, ph.phase)
  const abgeschlossen = t.status === 'abgeschlossen'
  const endtestung = ph.art === 'endtestung'
  const titel = `${ART_TEXT[ph.art]} · ${phaseNach(ph.phase).name}`
  const datum = datumDeutsch(t.datum)

  // gleiche Reihenfolge wie rtsVorschlag().wasFehlt: zuerst die Zeit, dann die Pflicht-Tests
  const nichtErfuellt = v.pflicht.filter((p) => p.status !== 'erfuellt')
  const offen: LetzterStand['offen'] = []
  if (endtestung && !v.zeitErfuellt) offen.push({ text: v.wasFehlt[0], ampel: null })
  const versatz = endtestung && !v.zeitErfuellt ? 1 : 0
  nichtErfuellt.forEach((p, i) =>
    offen.push({ text: v.wasFehlt[i + versatz], ampel: p.status === 'fehlt' && !p.klinischAnders ? null : (a.get(p.test.id)?.ergebnis.ampel ?? null) }),
  )

  let aussage = titel
  let herkunft = `${ART_TEXT[ph.art]} vom ${datum}`
  if (endtestung) {
    const e = t.entscheidung
    const vorschlagErfuellt = abgeschlossen && e?.vorschlagBeiAbschluss ? e.vorschlagBeiAbschluss === 'erfuellt' : v.erfuellt
    const ende = abgeschlossen ? endErgebnis(e, vorschlagErfuellt) : null
    if (ende && e?.art) {
      aussage = RTS_TEXT[ende]
      herkunft = `Beurteilung der Therapeut:in (${ENTSCHEIDUNG_TEXT[e.art]}), Endtestung vom ${datum}`
    } else {
      aussage = vorschlagErfuellt ? RTS_TEXT.erfuellt : RTS_TEXT.nicht_erfuellt
      herkunft = `Vorschlag der App, Endtestung vom ${datum}`
    }
  }

  return {
    testung: t,
    titel,
    aussage,
    herkunft,
    endtestung,
    abgeschlossen,
    fortschritt: fortschritt(t, ph.phase),
    offen,
    warnung: v.aclRsiWarnung,
  }
}

export interface LsiKennzahl {
  testId: string
  name: string
  wert: number
  ziel: number | null
  ampel: Ampel | null
  datum: string
}

/** LSI eines Tests aus der neuesten Testung, in der er gemessen wurde – kein Durchschnitt, nichts Neues. */
export function lsiKennzahl(patient: Patient, testungen: readonly Testung[], testId: string): LsiKennzahl | null {
  for (const t of nachDatum(testungen)) {
    const ph = phasenStand(t, patient.opDatum)
    const aus = werteAus(t, ph.phase, patient.geschlecht).get(testId)
    const e = aus?.ergebnis.kriterien.find((k) => k.kriterium.art === 'lsi')
    if (aus && e && typeof e.wert === 'number') {
      return {
        testId,
        name: aus.ergebnis.test.name,
        wert: e.wert,
        ziel: e.schwelle?.wert ?? null,
        ampel: e.zustand === 'bewertet' ? (e.ampel ?? null) : null,
        datum: datumDeutsch(t.datum),
      }
    }
  }
  return null
}
