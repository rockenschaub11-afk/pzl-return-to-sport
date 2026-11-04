// Export je Kürzel (Übergabe, F7), Gesamtsicherung (F8) und Import (Etappe-10-Fragen 2, 3).
// Datenbankaufbau bleibt unverändert – Dateien enthalten genau die gespeicherten Einträge.

import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Einstellung, type Testung } from '../db'
import { PHASEN_IDS } from '../katalog/typen'
import { freiesKuerzel, type Patient } from '../patienten/stammdaten'
import { verschluesseln, type DateiArt } from './krypto'

/** Einstellungen, die mitgesichert werden (nicht: Darstellung – die gehört zum Browser). */
export const GESICHERTE_EINSTELLUNGEN = ['meloqAuswahl', 'therapeutKuerzel']
export const LETZTE_SICHERUNG = 'letzteSicherung'
export const ERINNERUNG_TAGE = 7

export interface Inhalt {
  patienten: Patient[]
  testungen: Testung[]
  einstellungen: Einstellung[]
}

const heute = () => new Date().toISOString().slice(0, 10)

export async function kuerzelExportieren(patientId: string, passwort: string, runden?: number): Promise<{ dateiname: string; text: string }> {
  const p = await db.patienten.get(patientId)
  if (!p) throw new Error('Dieses Kürzel gibt es nicht (mehr).')
  const inhalt: Inhalt = { patienten: [p], testungen: await db.testungen.where('patientId').equals(patientId).toArray(), einstellungen: [] }
  return { dateiname: `PZL-${p.kuerzel}-${heute()}.pzlrts`, text: await verschluesseln(inhalt, passwort, 'kuerzel', runden) }
}

export async function gesamtExportieren(passwort: string, runden?: number): Promise<{ dateiname: string; text: string }> {
  const einstellungen = (await db.einstellungen.toArray()).filter((e) => GESICHERTE_EINSTELLUNGEN.includes(e.id))
  const inhalt: Inhalt = { patienten: await db.patienten.toArray(), testungen: await db.testungen.toArray(), einstellungen }
  const text = await verschluesseln(inhalt, passwort, 'gesamt', runden)
  return { dateiname: `PZL-Sicherung-${heute()}.pzlrts`, text }
}

/** Nach dem Herunterladen einer Gesamtsicherung merken (für die Wochen-Erinnerung). */
export async function sicherungVermerken(zeitpunkt = new Date()): Promise<void> {
  await db.einstellungen.put({ id: LETZTE_SICHERUNG, wert: zeitpunkt.toISOString() })
}

/** Tage seit der letzten Gesamtsicherung; fällig, wenn es Daten gibt und nie bzw. vor mehr als 7 Tagen gesichert wurde. */
export function sicherungsStand(letzte: string | undefined, anzahlKuerzel: number, jetzt = new Date()): { tage: number | null; faellig: boolean } {
  const tage = letzte ? Math.floor((jetzt.getTime() - new Date(letzte).getTime()) / 86_400_000) : null
  return { tage, faellig: anzahlKuerzel > 0 && (tage === null || tage >= ERINNERUNG_TAGE) }
}

/** Stand der Gesamtsicherung für Seite, Startseite und Seitenleiste (undefined = lädt). */
export function useSicherungsStand(): { tage: number | null; faellig: boolean; letzte?: string } | undefined {
  return useLiveQuery(async () => {
    const letzte = (await db.einstellungen.get(LETZTE_SICHERUNG))?.wert as string | undefined
    return { ...sicherungsStand(letzte, await db.patienten.count()), letzte }
  }, [])
}

const istObjekt = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const istText = (v: unknown): v is string => typeof v === 'string'
const istDatum = (v: unknown) => istText(v) && /^\d{4}-\d{2}-\d{2}$/.test(v)
const einerVon = (v: unknown, erlaubt: readonly unknown[]) => erlaubt.includes(v)

/** Grund, warum ein Eintrag nicht passt – oder null. Geprüft wird, worauf die App beim Anzeigen und Rechnen baut. */
function patientFehler(p: unknown): string | null {
  if (!istObjekt(p)) return 'kein Eintrag'
  if (!istText(p.id) || !p.id) return 'id fehlt'
  if (!istText(p.kuerzel) || !istText(p.kuerzelNorm) || !p.kuerzelNorm) return 'Kürzel fehlt'
  if (!(p.opDatum === '' || istDatum(p.opDatum))) return 'OP-Datum ungültig'
  if (!einerVon(p.seite, ['links', 'rechts', ''])) return 'Seite ungültig'
  if (!Array.isArray(p.begleitOps)) return 'Begleit-OPs fehlen'
  return null
}

function testungFehler(t: unknown, patientIds: ReadonlySet<string>): string | null {
  if (!istObjekt(t)) return 'kein Eintrag'
  if (!istText(t.id) || !t.id) return 'id fehlt'
  if (!istText(t.patientId) || !patientIds.has(t.patientId)) return 'gehört zu keinem Kürzel in der Datei'
  if (!einerVon(t.art, ['endtestung', 'verlauf'])) return 'Art ungültig'
  if (!einerVon(t.status, ['in_arbeit', 'abgeschlossen'])) return 'Status ungültig'
  if (t.phase !== undefined && !einerVon(t.phase, PHASEN_IDS)) return 'Phase ungültig'
  if (!istDatum(t.datum)) return 'Datum ungültig'
  if (!istText(t.geaendertAm) || !t.geaendertAm) return 'Änderungszeitpunkt fehlt'
  if (!istText(t.koerpergewichtKg) || !istText(t.tegnerAktuell)) return 'Körpergewicht oder Tegner ungültig'
  if (!Array.isArray(t.optionaleTests) || !t.optionaleTests.every(istText)) return 'optionale Tests ungültig'
  // Eingaben liegen genau wie getippt als Text vor – nur so rechnet die App sie richtig
  if (!istObjekt(t.eingaben) || !Object.values(t.eingaben).every((e) => istObjekt(e) && Object.values(e).every(istText))) return 'Eingaben ungültig'
  for (const feld of ['entscheidung', 'klinischAnders', 'phaseUebersteuert'] as const) {
    if (t[feld] !== undefined && !istObjekt(t[feld])) return `${feld} ungültig`
  }
  if (istObjekt(t.entscheidung) && !einerVon(t.entscheidung.art, ['bestaetigt', 'ueberstimmt_erfuellt', 'ueberstimmt_nicht_erfuellt', ''])) return 'Entscheidung ungültig'
  // Motor Control (Philipp 04.11.2026): je Test Seiten b/g/v mit Status und Kompensationen als Text, Freitext
  if (t.motorControl !== undefined) {
    if (!istObjekt(t.motorControl)) return 'Motor Control ungültig'
    for (const m of Object.values(t.motorControl)) {
      if (!istObjekt(m)) return 'Motor Control ungültig'
      if (m.text !== undefined && !istText(m.text)) return 'Motor Control ungültig'
      for (const s of ['b', 'g', 'v'] as const) {
        const w = m[s]
        if (w === undefined) continue
        if (!istObjekt(w) || !einerVon(w.status, ['bewertet', 'nicht_durchfuehrbar']) || !Array.isArray(w.kompensationen) || !w.kompensationen.every(istText)) return 'Motor Control ungültig'
      }
    }
  }
  if (t.fruehereAbschluesse !== undefined) {
    if (!Array.isArray(t.fruehereAbschluesse)) return 'frühere Abschlüsse ungültig'
    for (const f of t.fruehereAbschluesse) {
      if (!istObjekt(f) || !istText(f.abgeschlossenAm) || !istText(f.wiedergeoeffnetAm) || !einerVon(f.art, ['endtestung', 'verlauf'])) return 'frühere Abschlüsse ungültig'
      if (f.entscheidung !== undefined && (!istObjekt(f.entscheidung) || !einerVon(f.entscheidung.art, ['bestaetigt', 'ueberstimmt_erfuellt', 'ueberstimmt_nicht_erfuellt', '']))) return 'frühere Abschlüsse ungültig'
    }
  }
  return null
}

/** Prüft den entschlüsselten Inhalt, bevor irgendetwas geschrieben wird. */
export function inhaltPruefen(roh: unknown, art: DateiArt): Inhalt {
  const fehler = (wo?: string) => new Error(`Die Datei ist unvollständig oder beschädigt${wo ? ` (${wo})` : ''}.`)
  if (!istObjekt(roh)) throw fehler()
  const r = roh as Partial<Inhalt>
  if (!Array.isArray(r.patienten) || !Array.isArray(r.testungen)) throw fehler()
  if (art === 'kuerzel' && r.patienten.length !== 1) throw fehler()
  const ids = new Set<string>()
  r.patienten.forEach((p, i) => {
    const grund = patientFehler(p)
    if (grund) throw fehler(`Kürzel ${i + 1}: ${grund}`)
    if (ids.has(p.id)) throw fehler(`Kürzel ${i + 1}: doppelt`)
    ids.add(p.id)
  })
  const testungIds = new Set<string>()
  r.testungen.forEach((t, i) => {
    const grund = testungFehler(t, ids)
    if (grund) throw fehler(`Testung ${i + 1}: ${grund}`)
    if (testungIds.has(t.id)) throw fehler(`Testung ${i + 1}: doppelt`)
    testungIds.add(t.id)
  })
  const einstellungen = Array.isArray(r.einstellungen) ? r.einstellungen.filter((e) => istObjekt(e) && istText(e.id)) : []
  return { patienten: r.patienten, testungen: r.testungen, einstellungen }
}

// ---------- Kürzel-Datei importieren ----------

export interface KuerzelVorschau {
  patient: Patient
  testungen: number
  /** gleiches Kürzel schon auf diesem Laptop */
  vorhanden: { patient: Patient; testungen: number } | null
  /** Ausweich-Kürzel, falls als neues angelegt wird */
  ausweich: string
}

export async function kuerzelVorschau(inhalt: Inhalt): Promise<KuerzelVorschau> {
  const patient = inhalt.patienten[0]
  const vorhanden = await db.patienten.where('kuerzelNorm').equals(patient.kuerzelNorm).first()
  const alle = (await db.patienten.toArray()).map((p) => p.kuerzelNorm)
  return {
    patient,
    testungen: inhalt.testungen.length,
    vorhanden: vorhanden ? { patient: vorhanden, testungen: await db.testungen.where('patientId').equals(vorhanden.id).count() } : null,
    ausweich: freiesKuerzel(patient.kuerzelNorm, alle),
  }
}

/** Neue ids für ein Kürzel und seine Testungen (damit nichts Vorhandenes überschrieben wird). */
function mitNeuenIds(inhalt: Inhalt, kuerzel?: string): { patient: Patient; testungen: Testung[] } {
  const alt = inhalt.patienten[0]
  const id = crypto.randomUUID()
  const patient: Patient = { ...alt, id, ...(kuerzel ? { kuerzel, kuerzelNorm: kuerzel } : {}) }
  return { patient, testungen: inhalt.testungen.map((t) => ({ ...t, id: crypto.randomUUID(), patientId: id })) }
}

/**
 * Kürzel-Datei übernehmen. Ohne Konflikt wird es einfach angelegt; bei gleichem Kürzel
 * entscheidet die Therapeut:in: „ersetzen“ (vorhandenes samt Testungen weg) oder „neu“ (als …-2).
 */
export async function kuerzelImportieren(inhalt: Inhalt, wahl: 'ersetzen' | 'neu' | null): Promise<string> {
  const v = await kuerzelVorschau(inhalt)
  return db.transaction('rw', db.patienten, db.testungen, async () => {
    if (v.vorhanden && wahl === null) throw new Error('Bitte wählen: ersetzen oder als neues Kürzel anlegen.')
    if (v.vorhanden && wahl === 'ersetzen') {
      await db.testungen.where('patientId').equals(v.vorhanden.patient.id).delete()
      await db.patienten.delete(v.vorhanden.patient.id)
    }
    const neu = mitNeuenIds(inhalt, v.vorhanden && wahl === 'neu' ? v.ausweich : undefined)
    await db.patienten.add(neu.patient)
    await db.testungen.bulkAdd(neu.testungen)
    return neu.patient.id
  })
}

// ---------- Gesamtsicherung zusammenführen ----------

export interface Zusammenfuehrung {
  patienten: { neu: number; aktualisiert: number; unveraendert: number; umbenannt: string[] }
  testungen: { neu: number; aktualisiert: number; unveraendert: number }
}

/**
 * Sicherung mit dem Laptop zusammenführen: Fehlendes wird ergänzt, bei gleicher id gewinnt die zuletzt geänderte Fassung.
 * Nichts wird gelöscht. Gibt es dasselbe Kürzel mit anderer id (auf zwei Laptops getrennt angelegt), kommt es als …-2 dazu.
 * Mit `nurVorschau` wird nur gezählt, nichts geschrieben.
 */
export async function gesamtZusammenfuehren(inhalt: Inhalt, nurVorschau = false): Promise<Zusammenfuehrung> {
  const erg: Zusammenfuehrung = { patienten: { neu: 0, aktualisiert: 0, unveraendert: 0, umbenannt: [] }, testungen: { neu: 0, aktualisiert: 0, unveraendert: 0 } }
  const arbeit = async () => {
    const lokal = await db.patienten.toArray()
    const nachId = new Map(lokal.map((p) => [p.id, p]))
    const kuerzelVergeben = new Set(lokal.map((p) => p.kuerzelNorm))
    for (const p of inhalt.patienten) {
      const da = nachId.get(p.id)
      if (da) {
        if (p.geaendertAm > da.geaendertAm) {
          erg.patienten.aktualisiert++
          if (!nurVorschau) await db.patienten.put({ ...p, kuerzel: da.kuerzel, kuerzelNorm: da.kuerzelNorm })
        } else erg.patienten.unveraendert++
        continue
      }
      let neu = p
      if (kuerzelVergeben.has(p.kuerzelNorm)) {
        const ausweich = freiesKuerzel(p.kuerzelNorm, kuerzelVergeben)
        erg.patienten.umbenannt.push(`${p.kuerzelNorm} → ${ausweich}`)
        neu = { ...p, kuerzel: ausweich, kuerzelNorm: ausweich }
      }
      kuerzelVergeben.add(neu.kuerzelNorm)
      erg.patienten.neu++
      if (!nurVorschau) await db.patienten.add(neu)
    }
    for (const t of inhalt.testungen) {
      const da = await db.testungen.get(t.id)
      if (!da) {
        erg.testungen.neu++
        if (!nurVorschau) await db.testungen.add(t)
      } else if (t.geaendertAm > da.geaendertAm) {
        erg.testungen.aktualisiert++
        if (!nurVorschau) await db.testungen.put(t)
      } else erg.testungen.unveraendert++
    }
    for (const e of inhalt.einstellungen) {
      if (!GESICHERTE_EINSTELLUNGEN.includes(e.id)) continue
      if (!nurVorschau && !(await db.einstellungen.get(e.id))) await db.einstellungen.put(e)
    }
  }
  if (nurVorschau) await arbeit()
  else await db.transaction('rw', db.patienten, db.testungen, db.einstellungen, arbeit)
  return erg
}

/** Datei im Browser speichern („Herunterladen“) – nichts geht ins Internet. */
export function dateiSpeichern(dateiname: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/octet-stream' }))
  const a = document.createElement('a')
  a.href = url
  a.download = dateiname
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
