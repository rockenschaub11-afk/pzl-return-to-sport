export interface Bereich {
  pfad: string
  titel: string
  beschreibung: string
  etappe: string
}

// Reihenfolge = Reihenfolge in der Navigation
export const BEREICHE: Bereich[] = [
  {
    pfad: '/patienten',
    titel: 'Pat.-Liste',
    beschreibung: 'Kürzel anlegen und suchen, Stammdaten erfassen.',
    etappe: 'Etappe 2',
  },
  {
    pfad: '/testung',
    titel: 'Testung',
    beschreibung: 'Endtestung und Verlaufstests erfassen, Ampel und RTS-Vorschlag.',
    etappe: 'Etappen 4–7',
  },
  {
    pfad: '/berichte',
    titel: 'Berichte',
    beschreibung: 'Arztbericht und Pat./Trainer-Bericht als PDF.',
    etappe: 'Etappe 9',
  },
  {
    pfad: '/sicherung',
    titel: 'Sicherung',
    beschreibung: 'Export/Import je Kürzel und Gesamtsicherung mit Passwort.',
    etappe: 'Etappe 10',
  },
  {
    pfad: '/info',
    titel: 'Einstellungen/Info',
    beschreibung: 'Einstellungen, Quellen und Hinweise zur App.',
    etappe: 'spätere Etappen',
  },
]

export const HINWEIS = 'Dokumentations- und Rechenhilfe – ersetzt keine ärztliche Freigabe'
