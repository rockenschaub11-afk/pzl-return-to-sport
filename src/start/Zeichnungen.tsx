// Kleine Strichzeichnungen für die Einstiegs-Karten der Startseite (eigenes SVG, keine Fotos, keine fremde Lizenz).
// Rein dekorativ: Farben aus dem Designsystem, betroffen = Blau, gesund/Akzent = Türkis.

/** Knie von der Seite: Oberschenkel, Unterschenkel, Kniescheibe – das vordere Kreuzband hervorgehoben. */
export function KnieZeichnung() {
  return (
    <svg className="start-zeichnung" viewBox="0 0 180 130" aria-hidden="true">
      <g transform="translate(22 0)">
      {/* Umriss Bein, leicht gebeugt */}
      <path className="z-umriss" d="M50 0 C56 28 62 48 66 64 C70 80 66 100 68 130" />
      <path className="z-umriss" d="M116 0 C112 26 112 40 116 50 C120 62 114 74 110 86 C106 104 104 118 104 130" />
      {/* Oberschenkelknochen mit Gelenkrolle */}
      <path className="z-knochen" d="M66 0 L76 40 C68 48 70 62 84 62 C94 64 102 58 101 50 C100 44 97 41 94 39 L88 0" />
      {/* Schienbeinkopf, Schienbein, Wadenbein */}
      <path className="z-knochen" d="M74 72 C80 66 96 66 104 71 L99 80 L95 130 M79 80 L76 130" />
      <circle className="z-knochen" cx="106" cy="79" r="3" />
      <path className="z-knochen" d="M106 82 L102 130" />
      {/* Kniescheibe */}
      <ellipse className="z-knochen" cx="108" cy="52" rx="5" ry="9" transform="rotate(-12 108 52)" />
      {/* vorderes Kreuzband */}
      <path className="z-band" d="M86 60 L97 71" />
      <circle className="z-punkt" cx="86" cy="60" r="2.4" />
      <circle className="z-punkt" cx="97" cy="71" r="2.4" />
      {/* Hinweislinie */}
      <path className="z-hinweis" d="M97 71 L128 98 L150 98" />
      <circle className="z-punkt-leise" cx="150" cy="98" r="2" />
      </g>
    </svg>
  )
}

/** Kraftmessplatte schräg von oben, Fußabdruck, Kraftkurve darüber. */
export function PlattenZeichnung() {
  return (
    <svg className="start-zeichnung" viewBox="0 0 180 130" aria-hidden="true">
      {/* Platte */}
      <path className="z-umriss" d="M20 96 L108 70 L168 92 L80 122 Z" />
      <path className="z-umriss" d="M20 96 L20 102 L80 128 L80 122 M80 128 L168 98 L168 92" />
      <path className="z-knochen" d="M34 96 L108 75 L154 92 L80 117 Z" />
      {/* Sensoren in den Ecken */}
      <circle className="z-punkt-leise" cx="38" cy="96" r="1.8" />
      <circle className="z-punkt-leise" cx="106" cy="77" r="1.8" />
      <circle className="z-punkt-leise" cx="150" cy="92" r="1.8" />
      <circle className="z-punkt-leise" cx="82" cy="114" r="1.8" />
      {/* Fußabdruck */}
      <path className="z-band-gesund" d="M86 98 C82 92 88 86 96 88 C104 90 110 96 106 100 C102 104 92 104 86 98 Z" />
      {/* Kraftkurve über der Platte */}
      <path className="z-band" d="M14 52 L44 52 C52 52 54 46 58 34 C62 20 66 10 70 24 C74 40 76 54 84 54 L104 54 C110 54 112 40 116 30 C120 22 124 30 126 44 C128 52 132 54 140 54 L170 54" />
      <path className="z-hinweis" d="M96 88 L96 58" />
    </svg>
  )
}

/** Berichtsblatt mit kleinem Verlaufsdiagramm, Zielkorridor und Häkchen. */
export function BerichtZeichnung() {
  return (
    <svg className="start-zeichnung" viewBox="0 0 180 130" aria-hidden="true">
      <path className="z-umriss" d="M54 8 H136 L156 28 V124 H54 Z" />
      <path className="z-umriss" d="M136 8 V28 H156" />
      <path className="z-knochen" d="M66 22 H112 M66 32 H124" />
      {/* Diagramm mit Korridor */}
      <rect className="z-korridor" x="66" y="48" width="78" height="16" rx="3" />
      <path className="z-knochen" d="M66 90 H144" />
      <path className="z-band" d="M68 84 L88 76 L108 66 L130 56 L142 52" />
      <circle className="z-punkt" cx="88" cy="76" r="2.4" />
      <circle className="z-punkt" cx="108" cy="66" r="2.4" />
      <circle className="z-punkt-gesund" cx="130" cy="56" r="2.6" />
      {/* Zeilen mit Häkchen */}
      <path className="z-band-gesund" d="M66 104 l3 3 l6 -6 M66 116 l3 3 l6 -6" />
      <path className="z-knochen" d="M82 106 H128 M82 118 H116" />
    </svg>
  )
}
