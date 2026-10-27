// Hinweise je Test aus den Stammdaten (Graft, Begleit-OP) – nur Text, ohne Einfluss auf die Ampel
// (Etappe 12, Read Practitioner's Guide S. 21, 25–26, 46).

import type { Patient } from '../patienten/stammdaten'

const KNIE_FLEX = ['hhd_knie_flex', 'hhd_knie_flex_60', 'hhd_knie_flex_30']

export function stammdatenHinweise(testId: string, patient: Pick<Patient, 'graft' | 'begleitOps'>): string[] {
  const h: string[] = []
  if (patient.graft === 'hamstring' && KNIE_FLEX.includes(testId))
    h.push('Hamstring-Graft (ST/G): Flexoren-Defizite besonders beachten, v. a. bei > 75° – mehrere Winkel empfohlen (Read S. 25–26).')
  if (patient.graft === 'bptb' && testId === 'hhd_knie_ext') h.push('BPTB-Graft: Defizite betreffen v. a. den Quadrizeps (Read S. 26).')
  if (patient.graft === 'bptb' && testId === 'cmj')
    h.push('BPTB-Graft: Asymmetrien im exzentrischen und konzentrischen Impuls bilden sich langsamer zurück als nach Hamstring-Graft (Read S. 46).')
  if (testId === 'sl_squat') {
    const ops = [patient.begleitOps.includes('meniskus') && 'Meniskus-OP', patient.begleitOps.includes('let') && 'LET'].filter(Boolean)
    if (ops.length > 0) h.push(`Nach ${ops.join(' und ')} ist beim SL-Squat weniger Knieflexion zu erwarten – bei Ziel und Verlauf mitdenken (Read S. 21).`)
  }
  return h
}
