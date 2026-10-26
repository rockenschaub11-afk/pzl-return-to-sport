import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { db } from '../db'
import Laedt from '../Laedt'
import { datumDeutsch } from '../patienten/stammdaten'
import { DATEI_ENDUNG, entschluesseln, huelleLesen, PASSWORT_MIN, type DateiHuelle } from '../sicherung/krypto'
import {
  dateiSpeichern,
  gesamtExportieren,
  gesamtZusammenfuehren,
  inhaltPruefen,
  kuerzelExportieren,
  kuerzelImportieren,
  kuerzelVorschau,
  sicherungVermerken,
  useSicherungsStand,
  type Inhalt,
  type KuerzelVorschau,
  type Zusammenfuehrung,
} from '../sicherung/sicherung'

const fehlerText = (e: unknown) => (e instanceof Error ? e.message : 'Das hat nicht geklappt. Bitte nochmals versuchen.')

/** Passwort zweimal – beim Verschlüsseln muss es sicher richtig sein. */
function PasswortDoppelt({ wert, setWert, id }: { wert: [string, string]; setWert: (w: [string, string]) => void; id: string }) {
  const zuKurz = wert[0].length > 0 && wert[0].length < PASSWORT_MIN
  const ungleich = wert[1].length > 0 && wert[0] !== wert[1]
  return (
    <div className="feld-reihe">
      <label className={`feld${zuKurz ? ' feld-fehler' : ''}`}>
        <span className="feld-label">Passwort (mind. {PASSWORT_MIN} Zeichen)</span>
        <input id={`${id}-1`} type="password" autoComplete="off" value={wert[0]} onChange={(e) => setWert([e.target.value, wert[1]])} />
        {zuKurz && <span className="feld-meldung">Mindestens {PASSWORT_MIN} Zeichen.</span>}
      </label>
      <label className={`feld${ungleich ? ' feld-fehler' : ''}`}>
        <span className="feld-label">Passwort wiederholen</span>
        <input id={`${id}-2`} type="password" autoComplete="off" value={wert[1]} onChange={(e) => setWert([wert[0], e.target.value])} />
        {ungleich && <span className="feld-meldung">Die beiden Passwörter sind nicht gleich.</span>}
      </label>
    </div>
  )
}

const passwortOk = (w: [string, string]) => w[0].length >= PASSWORT_MIN && w[0] === w[1]

/** Seite „Sicherung“ (Etappe 10): Gesamtsicherung, Kürzel übergeben, Datei importieren. */
export default function SicherungSeite() {
  const patienten = useLiveQuery(() => db.patienten.orderBy('kuerzelNorm').toArray())
  const stand = useSicherungsStand()
  const [suche] = useSearchParams()

  if (!patienten || !stand) return <Laedt />

  return (
    <section className="sicherung">
      <div className="seitenkopf">
        <div>
          <h2 className="seitentitel">Sicherung</h2>
          <p className="seitenzusatz">
            Alle Daten liegen nur in diesem Browser. Sicherungs- und Exportdateien sind immer mit Passwort verschlüsselt – ohne Passwort kann sie niemand öffnen, auch
            nicht die App.
          </p>
        </div>
      </div>

      <GesamtExport stand={stand} anzahl={patienten.length} />
      <KuerzelExport patienten={patienten} vorwahl={suche.get('kuerzel') ?? ''} />
      <Import />
    </section>
  )
}

function GesamtExport({ stand, anzahl }: { stand: { tage: number | null; faellig: boolean; letzte?: string }; anzahl: number }) {
  const [pw, setPw] = useState<[string, string]>(['', ''])
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null)

  async function sichern(e: FormEvent) {
    e.preventDefault()
    if (!passwortOk(pw)) return
    setLaeuft(true)
    setMeldung(null)
    try {
      const { dateiname, text } = await gesamtExportieren(pw[0])
      dateiSpeichern(dateiname, text)
      await sicherungVermerken()
      setPw(['', ''])
      setMeldung({ ok: true, text: `Gespeichert als „${dateiname}“ (im Download-Ordner). Bitte an einem sicheren Ort ablegen, z. B. USB-Stick – und das Passwort merken.` })
    } catch (err) {
      setMeldung({ ok: false, text: fehlerText(err) })
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <form className={`karte block${stand.faellig ? ' karte-laut' : ''}`} onSubmit={sichern} aria-labelledby="titel-gesamt">
      <div className="block-kopf">
        <h3 className="block-titel" id="titel-gesamt">
          Gesamtsicherung
        </h3>
        <span className={`status${stand.faellig ? ' status-arbeit' : ''}`}>
          {stand.letzte ? `Letzte Sicherung ${datumDeutsch(stand.letzte.slice(0, 10))}${stand.tage !== null ? ` (vor ${stand.tage} ${stand.tage === 1 ? 'Tag' : 'Tagen'})` : ''}` : 'Noch nie gesichert'}
        </span>
      </div>
      <p className="hinweis-leise">
        Alle {anzahl} Kürzel mit allen Testungen und den persönlichen Einstellungen (Meloq-Auswahl, Therapeut:in-Kürzel). Empfohlen einmal pro Woche.
      </p>
      <PasswortDoppelt wert={pw} setWert={setPw} id="pw-gesamt" />
      <div className="aktionen">
        <button type="submit" className="knopf knopf-haupt" disabled={!passwortOk(pw) || laeuft || anzahl === 0}>
          <span>{laeuft ? 'Verschlüsselt …' : 'Sicherung herunterladen'}</span>
        </button>
        {anzahl === 0 && <span className="hinweis-leise">Noch keine Daten zum Sichern.</span>}
      </div>
      {meldung && (
        <p className={`meldung ${meldung.ok ? 'meldung-info' : 'meldung-fehler'}`} role="status">
          {meldung.text}
        </p>
      )}
    </form>
  )
}

function KuerzelExport({ patienten, vorwahl }: { patienten: { id: string; kuerzel: string }[]; vorwahl: string }) {
  const [wahl, setWahl] = useState(vorwahl)
  const [pw, setPw] = useState<[string, string]>(['', ''])
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null)

  async function exportieren(e: FormEvent) {
    e.preventDefault()
    if (!wahl || !passwortOk(pw)) return
    setLaeuft(true)
    setMeldung(null)
    try {
      const { dateiname, text } = await kuerzelExportieren(wahl, pw[0])
      dateiSpeichern(dateiname, text)
      setPw(['', ''])
      setMeldung({ ok: true, text: `Gespeichert als „${dateiname}“. Datei und Passwort getrennt weitergeben (z. B. Datei per USB-Stick, Passwort mündlich).` })
    } catch (err) {
      setMeldung({ ok: false, text: fehlerText(err) })
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <form className="karte block" onSubmit={exportieren} aria-labelledby="titel-kuerzel">
      <h3 className="block-titel" id="titel-kuerzel">
        Kürzel übergeben
      </h3>
      <p className="hinweis-leise">Ein Kürzel mit allen Testungen als Datei – z. B. für eine Kollegin oder einen Kollegen. Die Datei enthält keinen Namen.</p>
      <label className="feld">
        <span className="feld-label">Kürzel</span>
        <select value={wahl} onChange={(e) => setWahl(e.target.value)}>
          <option value="">Kürzel wählen …</option>
          {patienten.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kuerzel}
            </option>
          ))}
        </select>
      </label>
      <PasswortDoppelt wert={pw} setWert={setPw} id="pw-kuerzel" />
      <div className="aktionen">
        <button type="submit" className="knopf knopf-haupt" disabled={!wahl || !passwortOk(pw) || laeuft}>
          <span>{laeuft ? 'Verschlüsselt …' : 'Datei für Kürzel herunterladen'}</span>
        </button>
      </div>
      {meldung && (
        <p className={`meldung ${meldung.ok ? 'meldung-info' : 'meldung-fehler'}`} role="status">
          {meldung.text}
        </p>
      )}
    </form>
  )
}

type Geoeffnet =
  | { art: 'kuerzel'; huelle: DateiHuelle; inhalt: Inhalt; vorschau: KuerzelVorschau }
  | { art: 'gesamt'; huelle: DateiHuelle; inhalt: Inhalt; vorschau: Zusammenfuehrung }

function Import() {
  const [datei, setDatei] = useState<{ name: string; text: string } | null>(null)
  const [pw, setPw] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')
  const [offen, setOffen] = useState<Geoeffnet | null>(null)
  const [fertig, setFertig] = useState<string | null>(null)

  async function waehlen(f: File | undefined) {
    setFehler('')
    setOffen(null)
    setFertig(null)
    if (!f) return setDatei(null)
    const text = await f.text()
    try {
      huelleLesen(text)
      setDatei({ name: f.name, text })
    } catch (err) {
      setDatei(null)
      setFehler(fehlerText(err))
    }
  }

  async function oeffnen(e: FormEvent) {
    e.preventDefault()
    if (!datei) return
    setLaeuft(true)
    setFehler('')
    try {
      const { huelle, inhalt: roh } = await entschluesseln(datei.text, pw)
      const inhalt = inhaltPruefen(roh, huelle.art)
      if (huelle.art === 'kuerzel') setOffen({ art: 'kuerzel', huelle, inhalt, vorschau: await kuerzelVorschau(inhalt) })
      else setOffen({ art: 'gesamt', huelle, inhalt, vorschau: await gesamtZusammenfuehren(inhalt, true) })
    } catch (err) {
      setFehler(fehlerText(err))
    } finally {
      setLaeuft(false)
    }
  }

  async function uebernehmen(wahl: 'ersetzen' | 'neu' | null) {
    if (!offen) return
    setLaeuft(true)
    setFehler('')
    try {
      if (offen.art === 'kuerzel') {
        await kuerzelImportieren(offen.inhalt, wahl)
        setFertig(`Kürzel ${wahl === 'neu' ? offen.vorschau.ausweich : offen.vorschau.patient.kuerzel} mit ${offen.vorschau.testungen} Testungen übernommen.`)
      } else {
        const erg = await gesamtZusammenfuehren(offen.inhalt)
        setFertig(`Zusammengeführt: ${erg.patienten.neu} Kürzel und ${erg.testungen.neu} Testungen neu, ${erg.testungen.aktualisiert} Testungen aktualisiert.`)
      }
      setOffen(null)
      setDatei(null)
      setPw('')
    } catch (err) {
      setFehler(fehlerText(err))
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <div className="karte block" aria-labelledby="titel-import" role="group">
      <h3 className="block-titel" id="titel-import">
        Datei importieren
      </h3>
      <p className="hinweis-leise">Eine Gesamtsicherung oder eine Kürzel-Datei öffnen. Vor dem Übernehmen zeigt die App, was sich ändert – gelöscht wird nichts ohne Rückfrage.</p>

      {!offen && (
        <form onSubmit={oeffnen}>
          <div className="feld-reihe">
            <label className="feld">
              <span className="feld-label">Datei ({DATEI_ENDUNG})</span>
              <input type="file" accept={DATEI_ENDUNG} onChange={(e) => waehlen(e.target.files?.[0])} />
            </label>
            <label className="feld">
              <span className="feld-label">Passwort der Datei</span>
              <input type="password" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} />
            </label>
          </div>
          <div className="aktionen">
            <button type="submit" className="knopf knopf-haupt" disabled={!datei || !pw || laeuft}>
              <span>{laeuft ? 'Entschlüsselt …' : 'Datei öffnen'}</span>
            </button>
          </div>
        </form>
      )}

      {offen?.art === 'kuerzel' && (
        <div className="import-vorschau">
          <p>
            <strong>Kürzel {offen.vorschau.patient.kuerzel}</strong> mit {offen.vorschau.testungen} Testungen, Datei vom {datumDeutsch(offen.huelle.erstellt.slice(0, 10))}.
          </p>
          {offen.vorschau.vorhanden ? (
            <>
              <p className="meldung meldung-warnung">
                {offen.vorschau.patient.kuerzel} gibt es auf diesem Laptop schon ({offen.vorschau.vorhanden.testungen} Testungen, zuletzt geändert{' '}
                {datumDeutsch(offen.vorschau.vorhanden.patient.geaendertAm.slice(0, 10))}). Was soll passieren?
              </p>
              <div className="aktionen">
                <button type="button" className="knopf knopf-haupt" onClick={() => uebernehmen('neu')} disabled={laeuft}>
                  <span>Als {offen.vorschau.ausweich} anlegen</span>
                </button>
                <button type="button" className="knopf knopf-gefahr" onClick={() => uebernehmen('ersetzen')} disabled={laeuft}>
                  <span>Vorhandenes {offen.vorschau.patient.kuerzel} ersetzen</span>
                </button>
                <button type="button" className="knopf" onClick={() => setOffen(null)}>
                  <span>Abbrechen</span>
                </button>
              </div>
            </>
          ) : (
            <div className="aktionen">
              <button type="button" className="knopf knopf-haupt" onClick={() => uebernehmen(null)} disabled={laeuft}>
                <span>Kürzel übernehmen</span>
              </button>
              <button type="button" className="knopf" onClick={() => setOffen(null)}>
                <span>Abbrechen</span>
              </button>
            </div>
          )}
        </div>
      )}

      {offen?.art === 'gesamt' && (
        <div className="import-vorschau">
          <p>
            <strong>Gesamtsicherung</strong> vom {datumDeutsch(offen.huelle.erstellt.slice(0, 10))}. Beim Zusammenführen:
          </p>
          <ul>
            <li>
              Kürzel: {offen.vorschau.patienten.neu} neu, {offen.vorschau.patienten.aktualisiert} aktualisiert, {offen.vorschau.patienten.unveraendert} unverändert
            </li>
            <li>
              Testungen: {offen.vorschau.testungen.neu} neu, {offen.vorschau.testungen.aktualisiert} aktualisiert, {offen.vorschau.testungen.unveraendert} unverändert
            </li>
            {offen.vorschau.patienten.umbenannt.map((u) => (
              <li key={u}>Gleiches Kürzel auf beiden Geräten, wird umbenannt: {u}</li>
            ))}
          </ul>
          <p className="hinweis-leise">Nichts wird gelöscht. Bei derselben Testung gewinnt die zuletzt geänderte Fassung.</p>
          <div className="aktionen">
            <button type="button" className="knopf knopf-haupt" onClick={() => uebernehmen(null)} disabled={laeuft}>
              <span>Zusammenführen</span>
            </button>
            <button type="button" className="knopf" onClick={() => setOffen(null)}>
              <span>Abbrechen</span>
            </button>
          </div>
        </div>
      )}

      {fehler && (
        <p className="meldung meldung-fehler" role="alert">
          {fehler}
        </p>
      )}
      {fertig && (
        <p className="meldung meldung-info" role="status">
          {fertig} <Link to="/patienten">Zur Pat.-Liste</Link>
        </p>
      )}
    </div>
  )
}
