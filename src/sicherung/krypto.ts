// Verschlüsselte Export- und Sicherungsdateien (docs/ENTSCHEIDUNGEN.md F7, F8, F35; Etappe-10-Fragen).
// Web Crypto des Browsers: Schlüssel aus dem Passwort über PBKDF2 (SHA-256), Inhalt mit AES-GCM.
// Ohne Passwort ist die Datei nicht lesbar – es gibt keinen Weg zurück, wenn es vergessen wird.

export const DATEI_FORMAT = 'pzl-return-to-sport'
export const DATEI_VERSION = 1
export const DATEI_ENDUNG = '.pzlrts'
export const PASSWORT_MIN = 8

/** PBKDF2-Runden: hoch genug gegen Durchprobieren, auf einem Laptop unter einer Sekunde. */
export const STANDARD_RUNDEN = 310_000

export type DateiArt = 'kuerzel' | 'gesamt'

/** Was offen in der Datei steht – bewusst ohne Kürzel oder sonstige Inhalte. */
export interface DateiHuelle {
  format: typeof DATEI_FORMAT
  version: number
  art: DateiArt
  erstellt: string
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; runden: number; salz: string }
  iv: string
  daten: string
}

export class PasswortFalschFehler extends Error {
  constructor() {
    super('Passwort falsch oder Datei beschädigt.')
  }
}

export class KeineSicherungsdateiFehler extends Error {
  constructor() {
    super('Das ist keine Sicherungs- oder Exportdatei dieser App.')
  }
}

const zuBase64 = (b: Uint8Array) => btoa(Array.from(b, (x) => String.fromCharCode(x)).join(''))
const ausBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function schluessel(passwort: string, salz: Uint8Array, runden: number): Promise<CryptoKey> {
  const basis = await crypto.subtle.importKey('raw', new TextEncoder().encode(passwort), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salz as BufferSource, iterations: runden },
    basis,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function verschluesseln(inhalt: unknown, passwort: string, art: DateiArt, runden = STANDARD_RUNDEN): Promise<string> {
  if (passwort.length < PASSWORT_MIN) throw new Error(`Das Passwort braucht mindestens ${PASSWORT_MIN} Zeichen.`)
  const salz = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await schluessel(passwort, salz, runden)
  const klartext = new TextEncoder().encode(JSON.stringify(inhalt))
  const geheim = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, klartext))
  const huelle: DateiHuelle = {
    format: DATEI_FORMAT,
    version: DATEI_VERSION,
    art,
    erstellt: new Date().toISOString(),
    kdf: { name: 'PBKDF2', hash: 'SHA-256', runden, salz: zuBase64(salz) },
    iv: zuBase64(iv),
    daten: zuBase64(geheim),
  }
  return JSON.stringify(huelle)
}

/** Liest nur die offene Hülle (Art, Datum) – ohne Passwort. */
export function huelleLesen(text: string): DateiHuelle {
  let h: Partial<DateiHuelle>
  try {
    h = JSON.parse(text)
  } catch {
    throw new KeineSicherungsdateiFehler()
  }
  if (h?.format !== DATEI_FORMAT || (h.art !== 'kuerzel' && h.art !== 'gesamt') || !h.kdf || !h.iv || !h.daten) throw new KeineSicherungsdateiFehler()
  if ((h.version ?? 0) > DATEI_VERSION) throw new Error('Die Datei stammt aus einer neueren Version der App. Bitte die App aktualisieren.')
  return h as DateiHuelle
}

export async function entschluesseln(text: string, passwort: string): Promise<{ huelle: DateiHuelle; inhalt: unknown }> {
  const huelle = huelleLesen(text)
  try {
    const key = await schluessel(passwort, ausBase64(huelle.kdf.salz), huelle.kdf.runden)
    const klar = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ausBase64(huelle.iv) as BufferSource }, key, ausBase64(huelle.daten) as BufferSource)
    return { huelle, inhalt: JSON.parse(new TextDecoder().decode(klar)) }
  } catch {
    throw new PasswortFalschFehler()
  }
}
