// Beispiel-Pat. zum Durchklicken und Einschulen: Fantasie-Kürzel, keine echten Daten.
// Zeiten relativ zu heute, damit Phasen und Verlauf immer passen.

import { db, type Testung } from './db'
import { isoDatum, LEER, type Patient } from './patienten/stammdaten'

export const BEISPIEL_KUERZEL = 'DEMO-1990'

const vorMonaten = (monate: number, tage = 0) => {
  const d = new Date()
  d.setMonth(d.getMonth() - monate)
  d.setDate(d.getDate() - tage)
  return isoDatum(d)
}

const testung = (id: string, patientId: string, teil: Partial<Testung>): Testung => ({
  id,
  patientId,
  art: 'verlauf',
  status: 'in_arbeit',
  datum: '',
  koerpergewichtKg: '',
  tegnerAktuell: '',
  eingaben: {},
  optionaleTests: [],
  angelegtAm: new Date().toISOString(),
  geaendertAm: new Date().toISOString(),
  ...teil,
})

/** Legt DEMO-1990 mit Mitte- und Spät-Verlaufstest (abgeschlossen) und einer fast fertigen Endtestung an. */
export async function beispielAnlegen(): Promise<string> {
  if (await db.patienten.where('kuerzelNorm').equals(BEISPIEL_KUERZEL).first()) throw new Error(`${BEISPIEL_KUERZEL} gibt es schon.`)
  const patientId = crypto.randomUUID()
  const jetzt = new Date().toISOString()
  const patient: Patient = {
    ...LEER,
    id: patientId,
    kuerzel: BEISPIEL_KUERZEL,
    kuerzelNorm: BEISPIEL_KUERZEL,
    seite: 'links',
    opDatum: vorMonaten(12),
    niveau: 'wettkampf',
    geschlecht: 'maennlich',
    geburtsjahr: '2001',
    beinlaengeCm: '94',
    graft: 'hamstring',
    begleitOps: ['meniskus'],
    sportart: 'Fußball',
    tegner: '9',
    angelegtAm: jetzt,
    geaendertAm: jetzt,
  }
  const abgeschlossen = (datum: string) => ({
    status: 'abgeschlossen' as const,
    abgeschlossenAm: `${datum}T16:00:00.000Z`,
    entscheidung: { art: '' as const, begruendung: '', therapeut: 'DEMO' },
  })

  const mitte = testung(crypto.randomUUID(), patientId, {
    phase: 'mitte',
    datum: vorMonaten(9, -5),
    koerpergewichtKg: '76',
    tegnerAktuell: '3',
    ...abgeschlossen(vorMonaten(9, -5)),
    eingaben: {
      erguss: { wert: 'Spur' },
      rom_extension: { wert: '0' },
      rom_flexion: { g: '140', b: '125' },
      slr: { wert: 'ja' },
      hhd_knie_ext: { g1: '54', g2: '55', g3: '55', b1: '37', b2: '38', b3: '36' },
      hhd_knie_flex: { g1: '26', g2: '25', g3: '26', b1: '20', b2: '19', b3: '20' },
      cmj: { v1_hoehe: '24,1', v1_impL: '12,6', v1_impR: '10,4', v1_ct: '910', v2_hoehe: '25,2', v2_impL: '13', v2_impR: '10,5', v2_ct: '890' },
      sl_cmj: { g1_hoehe: '15', g1_imp: '8', g1_ct: '700', b1_hoehe: '9,8', b1_imp: '6,2', b1_ct: '820' },
      hop_platte: { impuls_asymmetrie: '14' },
      single_hop: { g1: '148', g2: '150', b1: '102', b2: '105' },
      sl_squat: { g: '100', b: '82' },
      sl_bridge: { g: '25', b: '14' },
      sl_calf_raise: { g: '28', b: '15' },
    },
  })

  const spaet = testung(crypto.randomUUID(), patientId, {
    phase: 'spaet',
    datum: vorMonaten(6, -5),
    koerpergewichtKg: '77',
    tegnerAktuell: '5',
    ...abgeschlossen(vorMonaten(6, -5)),
    eingaben: {
      erguss: { wert: '0' },
      rom_extension: { wert: '0' },
      rom_flexion: { g: '140', b: '132' },
      slr: { wert: 'ja' },
      hhd_knie_ext: { g1: '59', g2: '60', g3: '60', b1: '49', b2: '50', b3: '48' },
      hhd_knie_flex: { g1: '28', g2: '28', g3: '27', b1: '24', b2: '23', b3: '24' },
      cmj: { v1_hoehe: '30,1', v1_impL: '14,5', v1_impR: '12,8', v1_ct: '840' },
      sl_cmj: { g1_hoehe: '18,5', g1_imp: '9', g1_ct: '680', b1_hoehe: '14,8', b1_imp: '7,8', b1_ct: '760' },
      dj_bilateral: { hoehe: '27', asymmetrie: '11' },
      imtp: { v1: '275', v2: '280', v3: '278' },
      single_hop: { g1: '160', b1: '135' },
      triple_hop: { g1: '470', b1: '400' },
      crossover_hop: { g1: '410', b1: '350' },
      timed_hop: { g1: '2,15', b1: '2,55' },
      sl_bridge: { g: '27', b: '22' },
      sl_calf_raise: { g: '30', b: '22' },
      sl_sit_to_stand: { g: '20', b: '16' },
      acl_rsi: { wert: '45' },
    },
  })

  // Endtestung in Arbeit: fast alles erfüllt – SL-Drop-Jump-LSI knapp, ACL-RSI unter 55 → zum Ausprobieren
  const ende = testung(crypto.randomUUID(), patientId, {
    art: 'endtestung',
    phase: 'rtc',
    datum: vorMonaten(0, 2),
    koerpergewichtKg: '78',
    tegnerAktuell: '7',
    optionaleTests: ['koos'],
    eingaben: {
      erguss: { wert: '0' },
      rom_extension: { wert: '0' },
      rom_flexion: { g: '140', b: '136' },
      slr: { wert: 'ja' },
      hhd_knie_ext: { g1: '64', g2: '66', g3: '65', b1: '60', b2: '62', b3: '61', winkel: '60' },
      hhd_knie_flex: { g1: '30', g2: '31', g3: '30', b1: '27', b2: '28', b3: '27' },
      hhd_hueft_abd: { g1: '22', g2: '22', g3: '21', b1: '20', b2: '20', b3: '19' },
      cmj: {
        v1_hoehe: '33,5', v1_impL: '15,2', v1_impR: '14', v1_ct: '810',
        v2_hoehe: '34,6', v2_impL: '15,6', v2_impR: '14,4', v2_ct: '790',
        v3_hoehe: '34', v3_impL: '15,4', v3_impR: '14,2', v3_ct: '800',
        z_flugzeit: '531', z_peak_force_l: '98', z_peak_force_r: '92', z_peak_power_l: '2350', z_peak_power_r: '2180',
      },
      sl_cmj: { g1_hoehe: '20,5', g1_imp: '9,8', g1_ct: '650', b1_hoehe: '18,6', b1_imp: '9', b1_ct: '690' },
      sl_dj: { g1_hoehe: '19,5', g1_rsi: '0,55', g1_kz: '300', b1_hoehe: '17,5', b1_rsi: '0,48', b1_kz: '340', box: '30' },
      imtp: { v1: '290', v2: '300', v3: '296' },
      single_hop: { g1: '162', g2: '165', g3: '164', b1: '150', b2: '152', b3: '149' },
      triple_hop: { g1: '475', g2: '480', b1: '440', b2: '445' },
      crossover_hop: { g1: '415', g2: '420', b1: '378', b2: '380' },
      timed_hop: { g1: '2,12', g2: '2,1', b1: '2,3', b2: '2,28' },
      sl_bridge: { g: '28', b: '27' },
      sl_calf_raise: { g: '30', b: '26' },
      sl_sit_to_stand: { g: '22', b: '20' },
      acl_rsi: { wert: '52' },
      ikdc: { wert: '86,2' },
      koos: { koos_symptome: '89,3', koos_schmerz: '94,4', koos_alltag: '98,5', koos_sport: '80', koos_lebensqualitaet: '68,8' },
    },
  })

  await db.transaction('rw', db.patienten, db.testungen, async () => {
    await db.patienten.add(patient)
    await db.testungen.bulkAdd([mitte, spaet, ende])
  })
  return patientId
}

export async function beispielLoeschen(): Promise<boolean> {
  const p = await db.patienten.where('kuerzelNorm').equals(BEISPIEL_KUERZEL).first()
  if (!p) return false
  await db.transaction('rw', db.patienten, db.testungen, async () => {
    await db.testungen.where('patientId').equals(p.id).delete()
    await db.patienten.delete(p.id)
  })
  return true
}
