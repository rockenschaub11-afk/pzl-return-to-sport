import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Spinnennetz, { type NetzAchse } from './Spinnennetz'

const ext: NetzAchse = { name: 'Kraft vorne', lsi: 72.4, ampel: 'rot', vorige: 61 }
const flex: NetzAchse = { name: 'Kraft hinten', lsi: 93, ampel: 'gruen', vorige: null }

describe('Seitenvergleich im Pat.-Bericht', () => {
  it('ohne Test mit Seitenvergleich: nur Hinweis', () => {
    render(<Spinnennetz achsen={[]} />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText(/Noch keine Tests mit Seitenvergleich/)).toBeInTheDocument()
  })

  it('1–2 Tests: Balken mit Wert, Ampelzeichen und Legende (erster Pat. 04.11.2026)', () => {
    const { container } = render(<Spinnennetz achsen={[ext, flex]} vorigeDatum="20.10.2026" />)
    const bild = screen.getByRole('img', { name: /Seitenvergleich/ })
    expect(bild.getAttribute('aria-label')).toContain('Kraft vorne 72,4 % ✗')
    expect(container.querySelectorAll('.netz-balken-fuellung')).toHaveLength(2)
    expect(container.querySelectorAll('.netz-vorige')).toHaveLength(1)
    expect(screen.getByText('zuvor 61,0 % · +11,4 Prozentpunkte')).toBeInTheDocument()
    expect(screen.getByText(/zuvor \(20\.10\.2026\)/)).toBeInTheDocument()
  })

  it('ab 3 Tests: Spinnennetz', () => {
    render(<Spinnennetz achsen={[ext, flex, { name: 'Sprung', lsi: 88, ampel: 'gelb' }]} />)
    expect(screen.getByRole('img', { name: /Spinnennetz/ })).toBeInTheDocument()
  })
})
