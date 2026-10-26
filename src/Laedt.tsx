// Ladezustand (DESIGNKONZEPT 10.7): ruhige Platzhalter-Flächen statt leerer Seite,
// erst nach 300 ms – damit schnelle Seiten nicht kurz flimmern.

import { useEffect, useState } from 'react'

export default function Laedt({ zeilen = 3 }: { zeilen?: number }) {
  const [sichtbar, setSichtbar] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSichtbar(true), 300)
    return () => clearTimeout(t)
  }, [])
  if (!sichtbar) return null
  return (
    <div className="karte laedt" role="status" aria-label="Lädt …">
      {Array.from({ length: zeilen }, (_, i) => (
        <span key={i} className="laedt-zeile" style={{ width: `${[60, 90, 75, 85][i % 4]}%` }} />
      ))}
    </div>
  )
}
