import type { Bereich } from '../navigation'

export default function Platzhalter({ bereich }: { bereich: Bereich }) {
  return (
    <section>
      <div className="seitenkopf">
        <h2 className="seitentitel">{bereich.titel}</h2>
      </div>
      <div className="karte">
        <p>{bereich.beschreibung}</p>
        <p className="platzhalter-etappe">Dieser Bereich folgt in {bereich.etappe}.</p>
      </div>
    </section>
  )
}
