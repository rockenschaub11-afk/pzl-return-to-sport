import { useEffect, useRef } from 'react'
import { ausloesen, neuerKanal, planen, vorbereiten, wertImKanal, type Kanal } from '../start/monitor'

const logoUrl = `${import.meta.env.BASE_URL}logo-pzl.svg`

// Eine Kurve braucht so lange von rechts nach links über den Bildschirm
const SICHTBAR_S = 4

// Kanäle von oben nach unten: Anteil der Höhe, Linienfarben, Stärke
const SPUREN = [
  { art: 'cmj', anteil: 0.44, farben: ['#4d9fff', '#4fe0f0'], breite: 2.4, deckkraft: 1 },
  { art: 'ext', anteil: 0.28, farben: ['#8fc4ff'], breite: 1.8, deckkraft: 0.6 },
  { art: 'dj', anteil: 0.28, farben: ['#4fe0f0'], breite: 1.8, deckkraft: 0.6 },
] as const

function wenigerBewegung(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function zeichnen(ctx: CanvasRenderingContext2D, kanaele: Kanal[], jetzt: number, breite: number, hoehe: number) {
  ctx.clearRect(0, 0, breite, hoehe)
  const proPixel = SICHTBAR_S / breite
  const schritt = 2 // jede zweite Pixelspalte reicht für glatte Linien
  let oben = 0
  SPUREN.forEach((spur, k) => {
    const band = hoehe * spur.anteil
    const kanal = kanaele[k]
    const unten = oben + band * 0.88
    const skala = (band * 0.72) / kanal.max
    spur.farben.forEach((farbe, linie) => {
      ctx.beginPath()
      for (let x = 0; x <= breite; x += schritt) {
        const t = jetzt - (breite - x) * proPixel
        const y = unten - wertImKanal(kanal, linie, t) * skala
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.globalAlpha = spur.deckkraft
      ctx.strokeStyle = farbe
      ctx.lineWidth = spur.breite
      ctx.lineJoin = 'round'
      ctx.shadowColor = farbe
      ctx.shadowBlur = 8
      ctx.stroke()
    })
    // „Schreibkopf“ am rechten Rand
    const yKopf = unten - wertImKanal(kanal, 0, jetzt) * skala
    ctx.globalAlpha = spur.deckkraft
    ctx.fillStyle = spur.farben[0]
    ctx.shadowBlur = 14
    ctx.beginPath()
    ctx.arc(breite - 3, yKopf, 3, 0, Math.PI * 2)
    ctx.fill()
    oben += band
  })
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}

export default function Start() {
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

  // Klick irgendwo: sofort ein Sprung auf der CMJ-Spur
  function springen() {
    const cmj = kanaeleRef.current[0]
    if (cmj) ausloesen(cmj, uhrRef.current(), Math.random)
  }

  return (
    <section className="start" onClick={springen}>
      <canvas ref={canvasRef} className="start-monitor" aria-hidden="true" />
      <div className="start-mitte">
        <div className="start-logo-flaeche">
          <img className="start-logo" src={logoUrl} alt="Physio Zentrum Linz" />
        </div>
        <h1 className="start-titel">PZL Return-to-Sport</h1>
        <p className="start-unterzeile">VKB-Testbatterie · Physio Zentrum Linz</p>
      </div>
    </section>
  )
}
