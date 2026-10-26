// Startseite (ENTSCHEIDUNGEN 10a Startseite, Nachtrag 26.10.2026): Bühne mit Titel und Messfenster,
// darunter Arbeitsbereich mit Einstiegen und den letzten Testungen. Kurven sind modelliert – keine Messdaten.

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db'
import { phaseNach } from '../katalog'
import { datumDeutsch } from '../patienten/stammdaten'
import { nachDatum } from '../patienten/uebersicht'
import { ausloesen, neuerKanal, planen, vorbereiten, wertImKanal, type Kanal } from '../start/monitor'
import { ART_TEXT, phasenStand, statusText } from '../testung/ablauf'

// Eine Kurve braucht so lange von rechts nach links über das Messfenster
const SICHTBAR_S = 4

// Spuren von oben nach unten: Anteil der Höhe, Farbrollen (betroffen/gesund aus dem Designsystem), Stärke
const SPUREN = [
  { art: 'cmj', anteil: 0.46, farben: ['--seite-betroffen', '--seite-gesund'], breite: 2.2, deckkraft: 1 },
  { art: 'ext', anteil: 0.27, farben: ['--seite-betroffen'], breite: 1.6, deckkraft: 0.55 },
  { art: 'dj', anteil: 0.27, farben: ['--seite-gesund'], breite: 1.6, deckkraft: 0.55 },
] as const

function wenigerBewegung(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function zeichnen(ctx: CanvasRenderingContext2D, kanaele: Kanal[], jetzt: number, breite: number, hoehe: number) {
  const stil = getComputedStyle(ctx.canvas)
  const farbe = (rolle: string) => stil.getPropertyValue(rolle).trim() || '#5ea8ea'
  const linie = stil.getPropertyValue('--linie').trim() || '#3b4048'
  ctx.clearRect(0, 0, breite, hoehe)
  const proPixel = SICHTBAR_S / breite
  const schritt = 2 // jede zweite Pixelspalte reicht für glatte Linien
  let oben = 0
  SPUREN.forEach((spur, k) => {
    const band = hoehe * spur.anteil
    const kanal = kanaele[k]
    const unten = oben + band * 0.86
    const skala = (band * 0.7) / kanal.max
    // feine Nulllinie je Spur – präzise statt leuchtend
    ctx.globalAlpha = 1
    ctx.strokeStyle = linie
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, Math.round(unten) + 0.5)
    ctx.lineTo(breite, Math.round(unten) + 0.5)
    ctx.stroke()
    spur.farben.forEach((rolle, li) => {
      ctx.beginPath()
      for (let x = 0; x <= breite; x += schritt) {
        const t = jetzt - (breite - x) * proPixel
        const y = unten - wertImKanal(kanal, li, t) * skala
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.globalAlpha = spur.deckkraft
      ctx.strokeStyle = farbe(rolle)
      ctx.lineWidth = spur.breite
      ctx.lineJoin = 'round'
      ctx.shadowColor = farbe(rolle)
      ctx.shadowBlur = 2
      ctx.stroke()
    })
    // „Schreibkopf“ am rechten Rand – ohne Hof
    const yKopf = unten - wertImKanal(kanal, 0, jetzt) * skala
    ctx.shadowBlur = 0
    ctx.globalAlpha = spur.deckkraft
    ctx.fillStyle = farbe(spur.farben[0])
    ctx.beginPath()
    ctx.arc(breite - 4, yKopf, 3, 0, Math.PI * 2)
    ctx.fill()
    oben += band
  })
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}

/** Messfenster mit den modellierten Kraftkurven; Klick löst einen Sprung auf der CMJ-Spur aus (M9). */
function Messfenster() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const kanaeleRef = useRef<Kanal[]>([])
  const uhrRef = useRef<() => number>(() => performance.now() / 1000)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const uhr = uhrRef.current
    const kanaele = SPUREN.map((s) => neuerKanal(s.art))
    kanaele.forEach((k) => vorbereiten(k, uhr(), SICHTBAR_S, Math.random))
    kanaeleRef.current = kanaele

    let breite = 0
    let hoehe = 0
    const groesse = () => {
      const dpr = window.devicePixelRatio || 1
      breite = canvas.clientWidth
      hoehe = canvas.clientHeight
      canvas.width = Math.round(breite * dpr)
      canvas.height = Math.round(hoehe * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    groesse()
    const beobachter = typeof ResizeObserver === 'function' ? new ResizeObserver(groesse) : null
    beobachter?.observe(canvas)

    // „weniger Bewegung“: ein stehendes Bild
    if (wenigerBewegung()) {
      zeichnen(ctx, kanaele, uhr(), breite, hoehe)
      return () => beobachter?.disconnect()
    }

    let rahmen = 0
    const schleife = () => {
      const jetzt = uhr()
      kanaele.forEach((k) => planen(k, jetzt, SICHTBAR_S, Math.random))
      zeichnen(ctx, kanaele, jetzt, breite, hoehe)
      rahmen = requestAnimationFrame(schleife)
    }
    rahmen = requestAnimationFrame(schleife)
    return () => {
      cancelAnimationFrame(rahmen)
      beobachter?.disconnect()
    }
  }, [])

  function springen() {
    const cmj = kanaeleRef.current[0]
    if (cmj) ausloesen(cmj, uhrRef.current(), Math.random)
  }

  return (
    <div className="start-messfenster" onClick={springen}>
      <canvas ref={canvasRef} className="start-monitor" aria-hidden="true" />
    </div>
  )
}

const SYMBOL: Record<string, ReactNode> = {
  patienten: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 14.2c2.9.2 5 2.4 5 5.8" />
    </>
  ),
  testung: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 13V9M10 2.5h4M18.5 6.5l1.5-1.5" />
    </>
  ),
  berichte: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
}

function Symbol({ name }: { name: keyof typeof SYMBOL }) {
  return (
    <svg className="start-symbol" viewBox="0 0 24 24" aria-hidden="true">
      {SYMBOL[name]}
    </svg>
  )
}

export default function Start() {
  const patienten = useLiveQuery(() => db.patienten.toArray())
  const testungen = useLiveQuery(() => db.testungen.toArray())
  const kuerzel = new Map((patienten ?? []).map((p) => [p.id, p]))
  const neueste = nachDatum(testungen ?? []).filter((t) => kuerzel.has(t.patientId))
  const inArbeit = (testungen ?? []).filter((t) => t.status === 'in_arbeit').length

  const einstiege = [
    {
      ziel: '/patienten',
      symbol: 'patienten' as const,
      titel: 'Pat.-Liste',
      text: 'Kürzel anlegen, Stammdaten und Verlauf ansehen.',
      zahl: patienten?.length ?? 0,
      einheit: () => 'Kürzel auf diesem Laptop',
    },
    {
      ziel: '/testung',
      symbol: 'testung' as const,
      titel: 'Testung',
      text: 'Testbatterie durchführen und Werte erfassen.',
      zahl: inArbeit,
      einheit: (n: number) => (n === 1 ? 'Testung in Arbeit' : 'Testungen in Arbeit'),
    },
    {
      ziel: '/berichte',
      symbol: 'berichte' as const,
      titel: 'Berichte',
      text: 'Arztbericht und Pat./Trainer-Bericht drucken.',
      zahl: testungen?.length ?? 0,
      einheit: (n: number) => (n === 1 ? 'Testung mit Bericht' : 'Testungen mit Bericht'),
    },
  ]

  return (
    <section className="start" aria-labelledby="start-titel">
      <div className="start-buehne">
        <div className="start-text">
          <p className="start-dach">Kraftmessung · Sprungdiagnostik · Return-to-Sport</p>
          <h1 className="start-titel" id="start-titel">
            PZL Return-to-Sport
          </h1>
          <p className="start-unterzeile">VKB-Testbatterie · Physio Zentrum Linz</p>
          <p className="start-beschreibung">
            Testungen nach VKB-Verletzung dokumentieren und auswerten – mit Schwellen und Quellen je Kriterium. Alle Daten bleiben auf diesem Laptop.
          </p>
          <div className="start-aktionen">
            <Link to="/patienten" className="knopf knopf-haupt">
              <span>Pat.-Liste öffnen</span>
            </Link>
            <Link to="/testung" className="knopf">
              <span>Testung starten</span>
            </Link>
          </div>
        </div>
        <Messfenster />
      </div>

      <div className="start-arbeitsbereich">
        <div className="start-einstiege">
          <div className="start-abschnitt-kopf">
            <h2>Arbeitsbereich</h2>
            {neueste[0] && (
              <p className="start-kennung">
                Letzte Testung <strong>{datumDeutsch(neueste[0].datum)}</strong>
              </p>
            )}
          </div>
          <div className="start-karten">
            {einstiege.map((e) => (
              <Link key={e.ziel} to={e.ziel} className="karte start-karte">
                <Symbol name={e.symbol} />
                <span className="start-karte-titel">{e.titel}</span>
                <span className="start-karte-text">{e.text}</span>
                <span className="start-karte-zahl">
                  <strong>{e.zahl}</strong> {e.einheit(e.zahl)}
                </span>
                <span className="start-karte-pfeil" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="karte start-letzte" aria-label="Letzte Testungen">
          <h2>Letzte Testungen</h2>
          {neueste.length === 0 ? (
            <p className="hinweis-leise">Noch keine Testung. Über die Pat.-Liste ein Kürzel wählen und eine Testung beginnen.</p>
          ) : (
            <ul>
              {neueste.slice(0, 4).map((t) => {
                const p = kuerzel.get(t.patientId)!
                const ph = phasenStand(t, p.opDatum)
                return (
                  <li key={t.id}>
                    <Link to={`/testung/${t.id}`}>
                      <span className={`status${t.status === 'abgeschlossen' ? '' : ' status-arbeit'}`} aria-label={statusText(t)} />
                      <span className="start-letzte-text">
                        <strong>{p.kuerzel}</strong>
                        <span>
                          {ART_TEXT[ph.art]} · {phaseNach(ph.phase).name}
                        </span>
                      </span>
                      <span className="start-letzte-datum">{datumDeutsch(t.datum)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          <Link to="/testung" className="knopf start-alle">
            <span>Alle Testungen</span>
          </Link>
        </aside>
      </div>
    </section>
  )
}
