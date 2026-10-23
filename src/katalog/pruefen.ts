// Prüft die Konfigurationsdateien beim Start. Jede Meldung nennt Datei und Stelle,
// damit ein Tippfehler in config/ sofort auffällt und nicht still zu falschen Ampeln führt.

import { ARTEN, BLOECKE, MESSGERAETE, PHASEN_IDS, STATUS, VERGLEICHE, type Katalog } from './typen'

const istZahl = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const istText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const enthaelt = <T extends string>(liste: readonly T[], v: unknown): v is T => liste.includes(v as T)

export function pruefeKatalog(k: Katalog): string[] {
  const fehler: string[] = []
  const melde = (wo: string, was: string) => fehler.push(`${wo}: ${was}`)

  // Phasen
  const phasenIds = k.phasen.map((p) => p.id)
  if (phasenIds.join() !== PHASEN_IDS.join()) melde('phasen.json', `Phasen müssen ${PHASEN_IDS.join(', ')} in dieser Reihenfolge sein`)
  k.phasen.forEach((p, i) => {
    if (!istText(p.name)) melde(`phasen.json ${p.id}`, 'Name fehlt')
    if (!istZahl(p.vonMonat)) melde(`phasen.json ${p.id}`, 'vonMonat fehlt')
    const naechste = k.phasen[i + 1]
    if (naechste && p.bisMonat !== naechste.vonMonat) melde(`phasen.json ${p.id}`, 'bisMonat muss vonMonat der nächsten Phase sein')
  })

  // Regeln
  const r = k.regeln
  if (!istZahl(r.lsi?.gruenAb) || !istZahl(r.lsi?.gelbAb) || r.lsi.gelbAb >= r.lsi.gruenAb) melde('regeln.json', 'LSI-Grenzen fehlen oder gelbAb ≥ gruenAb')
  if (!istZahl(r.variationskoeffizientWarnungUeber)) melde('regeln.json', 'variationskoeffizientWarnungUeber fehlt')
  if (!istZahl(r.erdbeschleunigung)) melde('regeln.json', 'erdbeschleunigung fehlt')

  // Protokolle
  const protokollIds = new Set<string>()
  for (const p of k.protokolle) {
    if (protokollIds.has(p.id)) melde(`protokolle.json ${p.id}`, 'doppelte id')
    protokollIds.add(p.id)
    if (!istText(p.ablauf) || !istText(p.warum) || !istText(p.quelle)) melde(`protokolle.json ${p.id}`, 'ablauf, warum oder quelle fehlt')
  }

  // Tests
  const testIds = new Set<string>()
  for (const t of k.tests) {
    const wo = `tests.json ${t.id}`
    if (!istText(t.id)) melde('tests.json', 'Test ohne id')
    if (testIds.has(t.id)) melde(wo, 'doppelte id')
    testIds.add(t.id)
    if (!istText(t.name)) melde(wo, 'Name fehlt')
    if (!enthaelt(BLOECKE, t.block)) melde(wo, `unbekannter Block „${t.block}“`)
    if (!enthaelt(MESSGERAETE, t.messgeraet)) melde(wo, `unbekanntes Messgerät „${t.messgeraet}“`)
    if (!Array.isArray(t.phasen) || t.phasen.length === 0) melde(wo, 'keine Phasen')
    t.phasen?.forEach((p) => enthaelt(PHASEN_IDS, p) || melde(wo, `unbekannte Phase „${p}“`))
    if (t.protokoll && !protokollIds.has(t.protokoll)) melde(wo, `Protokoll „${t.protokoll}“ gibt es nicht`)
    if (!Array.isArray(t.kriterien) || t.kriterien.length === 0) melde(wo, 'keine Kriterien')

    const kritIds = new Set<string>()
    for (const kr of t.kriterien ?? []) {
      const kwo = `${wo} → ${kr.id}`
      if (kritIds.has(kr.id)) melde(kwo, 'doppelte id')
      kritIds.add(kr.id)
      if (!istText(kr.bezeichnung)) melde(kwo, 'Bezeichnung fehlt')
      if (!enthaelt(ARTEN, kr.art)) melde(kwo, `unbekannte Art „${kr.art}“`)
      if (!enthaelt(STATUS, kr.status)) melde(kwo, `unbekannter Status „${kr.status}“`)
      if (!istText(kr.quelle)) melde(kwo, 'Quelle fehlt')
      for (const [phase, wert] of Object.entries(kr.werte ?? {})) {
        if (phase !== 'alle' && !enthaelt(PHASEN_IDS, phase)) melde(kwo, `unbekannte Phase „${phase}“ in werte`)
        if (!istZahl(wert)) melde(kwo, `Schwelle für ${phase} ist keine Zahl`)
      }
      for (const [phase, b] of Object.entries(kr.bereiche ?? {})) {
        if (!enthaelt(PHASEN_IDS, phase)) melde(kwo, `unbekannte Phase „${phase}“ in bereiche`)
        if (!Array.isArray(b) || b.length !== 2 || !istZahl(b[0]) || !istZahl(b[1]) || b[0] > b[1]) melde(kwo, `Bereich für ${phase} ungültig`)
      }
      const hatSchwelle = Object.keys(kr.werte ?? {}).length > 0
      if ((kr.art === 'absolut' || kr.art === 'lsi' || kr.art === 'asymmetrie') && hatSchwelle && !enthaelt(VERGLEICHE, kr.vergleich))
        melde(kwo, 'Vergleich (>, >=, <, <=) fehlt')
      if ((kr.art === 'lsi' || kr.art === 'asymmetrie') && !t.seitenvergleich) melde(kwo, `${kr.art} ohne Seitenvergleich`)
      if (kr.art === 'auswahl' && (!kr.optionen?.length || !kr.erlaubt?.length || !kr.erlaubt.every((e) => kr.optionen!.includes(e))))
        melde(kwo, 'Auswahl braucht optionen und erlaubt (Teil der Optionen)')
      if ((kr.status === 'pflicht' || kr.status === 'wuenschenswert') && kr.art !== 'auswahl' && kr.art !== 'janein' && !hatSchwelle)
        melde(kwo, `${kr.status} ohne Schwelle`)
    }
  }
  return fehler
}
