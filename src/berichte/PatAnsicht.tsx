// Pat./Trainer-Bericht (aus pages/Bericht.tsx, Audit L2) – memo: rendert beim Tippen des Namens nicht neu.

import { memo, useMemo } from 'react'
import type { Testung } from '../db'
import { testNach } from '../katalog'
import type { Patient } from '../patienten/stammdaten'
import { einheitFest } from '../testung/erfassung'
import { patBericht, type PatBericht, type PatZeile } from './bericht'
import Spinnennetz from './Spinnennetz'

import { BewertungMarke, Fuss, Kopf, Tafel, teile } from './teile'

const GRUPPEN: { name: string; bloecke: readonly string[] }[] = [
  { name: 'Kraft', bloecke: ['hhd'] },
  { name: 'Kraftausdauer', bloecke: ['kraftausdauer'] },
  { name: 'Sprünge', bloecke: ['platten', 'hops'] },
]
const gruppeVon = (z: PatZeile) => {
  const id = z.id.split(':')[0]
  if (id === 'imtp') return 'Kraft'
  const block = testNach(id)?.block
  return GRUPPEN.find((g) => block && g.bloecke.includes(block))?.name ?? 'Sprünge'
}

const prozent = (v: number) => `${v.toLocaleString('de-AT')} %`

function PatWert({ z }: { z: PatZeile }) {
  const unter = z.wert !== null ? (z.wertArt === 'unterschied' ? `Unterschied zwischen den Beinen: ${z.wert}` : 'beidbeinig') : `gesund ${z.gesund} · betroffen ${z.betroffen}`
  return (
    <div className="bericht-wert">
      <div className="bericht-wert-name">
        {z.name}
        <small>{unter}</small>
      </div>
      <div className={`bericht-wert-zahl${z.lsi === null ? ' bericht-wert-ohne' : ''}`}>{z.lsi !== null ? prozent(z.lsi) : z.wertArt === 'beidbeinig' ? z.wert : ''}</div>
      <div className="bericht-wert-rechts">
        <BewertungMarke b={z.bewertung} />
        {z.vorige !== null && <small>zuvor {prozent(z.vorige)}</small>}
        {z.vorverletzung !== null && <small>vor der Verletzung: {prozent(z.vorverletzung)}</small>}
      </div>
    </div>
  )
}

function PatAnsicht({ patient, testung, alle }: { patient: Patient; testung: Testung; alle: Testung[] }) {
  const b: PatBericht = useMemo(() => patBericht(patient, testung, alle), [patient, testung, alle])
  const [, erreicht] = b.erreicht ? teile(b.erreicht) : [null, '']
  const zaehlung = /^(\d+ von \d+) (.+)$/.exec(erreicht)
  const [klinikLabel, klinikWert] = b.klinik ? teile(b.klinik) : [null, '']
  const gruppen = GRUPPEN.map((g) => ({ name: g.name, zeilen: b.zeilen.filter((z) => gruppeVon(z) === g.name) })).filter((g) => g.zeilen.length > 0)

  return (
    <article className="bericht bericht-pat" aria-label="Pat./Trainer-Bericht">
      <Kopf
        titel="Bericht für Pat. und Trainer:in"
        kuerzel={b.kuerzel}
        unter=""
        entwurf={b.entwurf}
        kontext={[
          ['Datum der Testung', b.datum, 'datum'],
          ['Testung', b.artText, 'liste'],
          ['Phase', b.phase, 'phase'],
        ]}
      />

      {(b.erreicht || b.klinik) && (
        <div className="bericht-band">
          {b.erreicht && (
            <div>
              <p className="bericht-label">{teile(b.erreicht)[0] ?? ''}:</p>
              {zaehlung ? (
                <p className="bericht-band-zahl">
                  <b>{zaehlung[1]}</b> <span>{zaehlung[2]}</span>
                </p>
              ) : (
                <p className="bericht-band-text">{erreicht}</p>
              )}
            </div>
          )}
          {b.klinik && (
            <div>
              {klinikLabel && <p className="bericht-label">{klinikLabel}:</p>}
              <p className="bericht-band-text">{klinikWert}</p>
            </div>
          )}
        </div>
      )}

      <div className="bericht-pat-mitte">
        <section>
          <h2>Seitenvergleich</h2>
          <Spinnennetz achsen={b.netz} vorigeDatum={b.vorigeDatum} />
        </section>
        <section className="bericht-pat-rechts">
          <Tafel titel={b.wasFehltTitel} symbol="liste" className="bericht-pat-fehlt">
            {b.wasFehlt.length > 0 ? (
              <ul>
                {b.wasFehlt.map((w) => {
                  const [kopf, text] = teile(w)
                  return (
                    <li key={w}>
                      {kopf && <b>{kopf}</b>}
                      {einheitFest(text)}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p>Alle Pflicht-Kriterien dieser Testung sind erreicht.</p>
            )}
          </Tafel>
          {b.hinweise.map((h) => {
            const [kopf, text] = teile(h)
            return (
              <Tafel key={h} titel={kopf ?? undefined} symbol="info" className="bericht-pat-hinweis">
                <p>{text}</p>
              </Tafel>
            )
          })}
          {b.ergebnis && (
            <div className="bericht-tafel bericht-tafel-innen bericht-beurteilung bericht-pat-ergebnis">
              <span className="bericht-label">Ergebnis der Testung (Beurteilung der Therapeut:in)</span>
              <strong>{b.ergebnis}</strong>
              <span>Ersetzt keine ärztliche Freigabe – die Rückkehr in den Sport besprechen Sie bitte mit Ihrer Ärztin / Ihrem Arzt.</span>
            </div>
          )}
        </section>
      </div>

      <section className="bericht-werte">
        <div className="bericht-werte-kopf">
          <h2>Ihre Werte</h2>
          <p>betroffenes Bein in % vom gesunden{b.vorigeDatum && b.zeilen.some((z) => z.vorige !== null) ? ` · „zuvor“ = letzte Testung vom ${b.vorigeDatum}` : ''}</p>
        </div>
        {b.zeilen.length === 0 ? (
          <p className="bericht-leise">Noch keine Leistungstests erfasst.</p>
        ) : (
          <div className="bericht-werte-raster">
            {gruppen.map((g) => (
              <div key={g.name} className="bericht-gruppe">
                <h3>{g.name}</h3>
                {g.zeilen.map((z) => (
                  <PatWert key={z.id} z={z} />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="bericht-lesehilfe">
        <div>
          <b>100 %</b>so viel wie das gesunde Bein
        </div>
        <div>
          <b>Ziel</b>meist mindestens 90 %
        </div>
        <div>
          <b>✓ ~ ✗</b>erfüllt · knapp · nicht erfüllt
        </div>
        {b.vorigeDatum && (
          <div>
            <b>zuvor</b>letzte Testung ({b.vorigeDatum})
          </div>
        )}
      </div>
      <Fuss />
    </article>
  )
}


export default memo(PatAnsicht)
