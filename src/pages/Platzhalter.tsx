import type { Bereich } from '../navigation'

export default function Platzhalter({ bereich }: { bereich: Bereich }) {
  return (
    <section className="karte">
      <h2>{bereich.titel}</h2>
      <p>{bereich.beschreibung}</p>
      <p className="platzhalter-etappe">Dieser Bereich folgt in {bereich.etappe}.</p>
    </section>
  )
}
