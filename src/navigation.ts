export interface Bereich {
  pfad: string
  titel: string
  /** kurzer Name für die Seitenleiste (sonst titel) */
  kurz?: string
  beschreibung: string
  etappe?: string // gesetzt = noch Platzhalter
}

// Reihenfolge = Reihenfolge in der Navigation
export const BEREICHE: Bereich[] = [
  {
    pfad: '/',
    titel: 'Start',
    beschreibung: 'Startseite mit Schnellstart.',
  },
  {
    pfad: '/patienten',
    titel: 'Pat.-Liste',
    beschreibung: 'Kürzel anlegen und suchen, Stammdaten erfassen.',
  },
  {
    pfad: '/testung',
    titel: 'Testung',
    beschreibung: 'Endtestung erfassen; Verlaufstests und RTS-Vorschlag folgen.',
  },
  {
    pfad: '/berichte',
    titel: 'Berichte',
    beschreibung: 'Arztbericht und Pat./Trainer-Bericht als PDF.',
  },
  {
    pfad: '/sicherung',
    titel: 'Sicherung',
    beschreibung: 'Export/Import je Kürzel und Gesamtsicherung mit Passwort.',
  },
  {
    pfad: '/info',
    titel: 'Einstellungen/Info',
    kurz: 'Info',
    beschreibung: 'Einstellungen, Testkatalog mit Schwellen und Quellen.',
  },
]

export const HINWEIS = 'Dokumentations- und Rechenhilfe – ersetzt keine ärztliche Freigabe'
