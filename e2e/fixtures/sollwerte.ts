// Sollwerte nur aus den Regeln, die in der App stehen – keine eigenen Grenzwerte:
// - LSI = betroffen / gesund × 100, bei Zeittests gesund / betroffen × 100 (src/rechnen/versuche.ts)
// - Bestwert = größter Versuch, bei Zeittests der kleinste
// - Ampel nach der angezeigten Zahl (eine Nachkommastelle): erfüllt ab 90, knapp ab 80 (config/regeln.json „lsi“)
// - 1 kg = 9,81 N (config/regeln.json „erdbeschleunigung“)
// - Kraft relativ in der Endtestung: Schwelle „Spät“ > 7,5 N/kg wird übernommen (config/tests.json hhd_knie_ext)
// Die Grenzfälle liegen bewusst bei ,96 / ,94 statt genau bei ,95 – dort kippt die Gleitkommazahl.

export interface LsiFall {
  name: string
  gesund: string[]
  betroffen: string[]
  /** wie in der Testkarte angezeigt */
  lsi: string
  ampel: 'erfüllt' | 'knapp' | 'nicht erfüllt'
}

export const KRAFT_LSI: LsiFall[] = [
  { name: 'Bestwerte 100 und 80 kg ergeben 80,0 % – knapp', gesund: ['100', '98', '99'], betroffen: ['80', '79', '78'], lsi: '80,0 %', ampel: 'knapp' },
  { name: '89,96 % wird als 90,0 % angezeigt und zählt als erfüllt', gesund: ['100'], betroffen: ['89,96'], lsi: '90,0 %', ampel: 'erfüllt' },
  { name: '89,94 % wird als 89,9 % angezeigt und bleibt knapp', gesund: ['100'], betroffen: ['89,94'], lsi: '89,9 %', ampel: 'knapp' },
  { name: '79,96 % wird als 80,0 % angezeigt und ist knapp', gesund: ['100'], betroffen: ['79,96'], lsi: '80,0 %', ampel: 'knapp' },
  { name: '79,94 % wird als 79,9 % angezeigt und ist nicht erfüllt', gesund: ['100'], betroffen: ['79,94'], lsi: '79,9 %', ampel: 'nicht erfüllt' },
  { name: 'betroffen stärker als gesund: 125,0 % – erfüllt', gesund: ['80'], betroffen: ['100'], lsi: '125,0 %', ampel: 'erfüllt' },
]

/** 80 kg betroffen × 9,81 / 80 kg Körpergewicht = 9,81 → 9,8 N/kg */
export const KRAFT_RELATIV = { betroffen: '80', gesund: '100', koerpergewicht: '80', anzeige: '9,8 N/kg', ziel: '> 7,5 N/kg' }

/** 784,8 N / 981 N × 100 = 80 % – gleich wie in kg */
export const KRAFT_NEWTON = { gesund: ['981'], betroffen: ['784,8'], lsi: '80,0 %' }

/** Zeittest 6 m Hop: gesund 2,00 s / betroffen 2,50 s × 100 = 80 % */
export const ZEITTEST = { gesund: ['2,10', '2,00', '2,05'], betroffen: ['2,60', '2,50', '2,55'], lsi: '80,0 %', bestGesund: '2 s', bestBetroffen: '2,50 s' }

/** Variationskoeffizient von 100/100/80 = 12,4 % – über der Grenze 10 % (config/regeln.json) */
export const STREUUNG = { gesund: ['100', '100', '80'], betroffen: ['90', '90', '90'] }
