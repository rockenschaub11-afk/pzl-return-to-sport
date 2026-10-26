// Spinnennetz L/R als eigenes SVG (ENTSCHEIDUNGEN Technik; Etappe-9-Frage 1):
// je Test mit Seitenvergleich eine Achse; gesundes Bein = 100-%-Ring, betroffenes Bein als Fläche in % (LSI), Ziel 90 % gestrichelt.

const B = 460
const H = 370
const MITTE = { x: B / 2, y: H / 2 + 4 }
const RADIUS = 120
/** äußerster Ring – LSI darüber wird am Rand gezeichnet */
const MAX = 120
const RINGE = [50, 80, 100, 120]

const zahl = (v: number) => v.toLocaleString('de-AT', { maximumFractionDigits: 0 })

function punkt(i: number, n: number, prozent: number) {
  const winkel = -Math.PI / 2 + (2 * Math.PI * i) / n
  const r = (Math.min(Math.max(prozent, 0), MAX) / MAX) * RADIUS
  return { x: MITTE.x + r * Math.cos(winkel), y: MITTE.y + r * Math.sin(winkel), cos: Math.cos(winkel), sin: Math.sin(winkel) }
}

const linie = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

export default function Spinnennetz({ achsen, ziel = 90 }: { achsen: { name: string; lsi: number }[]; ziel?: number }) {
  const n = achsen.length
  if (n < 3) return <p className="hinweis-leise">Für das Spinnennetz braucht es mindestens 3 Tests mit Seitenvergleich.</p>
  const ring = (prozent: number) => linie(achsen.map((_, i) => punkt(i, n, prozent)))

  return (
    <figure className="netz">
      <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label={`Spinnennetz: betroffenes Bein in Prozent des gesunden, ${achsen.map((a) => `${a.name} ${zahl(a.lsi)} %`).join(', ')}`}>
        {RINGE.map((r) => (
          <polygon key={r} points={ring(r)} className="netz-ring" />
        ))}
        {achsen.map((_, i) => {
          const p = punkt(i, n, MAX)
          return <line key={i} x1={MITTE.x} y1={MITTE.y} x2={p.x} y2={p.y} className="netz-achse" />
        })}
        <polygon points={ring(100)} className="netz-gesund" />
        <polygon points={ring(ziel)} className="netz-ziel" />
        <polygon points={linie(achsen.map((a, i) => punkt(i, n, a.lsi)))} className="netz-flaeche" style={{ transformOrigin: `${MITTE.x}px ${MITTE.y}px` }} />
        {achsen.map((a, i) => {
          const p = punkt(i, n, a.lsi)
          return <circle key={i} cx={p.x} cy={p.y} r={3.5} className="netz-punkt" />
        })}
        {achsen.map((a, i) => {
          const p = punkt(i, n, MAX)
          const anker = Math.abs(p.cos) < 0.2 ? 'middle' : p.cos > 0 ? 'start' : 'end'
          const x = p.x + p.cos * 8
          const y = p.y + p.sin * 12 + (p.sin > 0.2 ? 10 : -6)
          return (
            <text key={i} x={x} y={y} textAnchor={anker} className="netz-text">
              <tspan>{a.name}</tspan>
              <tspan x={x} dy="1.15em" className="netz-wert">
                {zahl(a.lsi)} %
              </tspan>
            </text>
          )
        })}
        <text x={MITTE.x + 3} y={punkt(0, n, 100).y - 3} className="netz-ring-text">
          100 %
        </text>
      </svg>
      <figcaption className="netz-legende">
        <span>
          <i className="netz-legende-gesund" /> gesundes Bein = 100 %
        </span>
        <span>
          <i className="netz-legende-betroffen" /> betroffenes Bein
        </span>
        <span>
          <i className="netz-legende-ziel" /> Ziel {ziel} %
        </span>
      </figcaption>
    </figure>
  )
}
