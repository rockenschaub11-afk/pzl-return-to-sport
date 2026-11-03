// Gemeinsame Zahlformate für die Anzeige (Audit K1) – nur Formatierung, gerundet wird wie bisher von toLocaleString.

/** Zahl auf Deutsch (Österreich): fest = immer genau so viele Nachkommastellen („80,0“), sonst höchstens („80“). */
export function zahlDe(v: number, nachkomma = 1, fest = false): string {
  return v.toLocaleString('de-AT', { minimumFractionDigits: fest ? nachkomma : 0, maximumFractionDigits: nachkomma })
}

/** LSI und andere Prozentwerte mit genau einer Nachkommastelle: „80,0 %“ */
export const prozentDe = (v: number) => `${zahlDe(v, 1, true)} %`
