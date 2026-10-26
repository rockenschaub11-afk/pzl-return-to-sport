import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BEREICHE } from './navigation'
import Seitenleiste from './Seitenleiste'

function zeige(pfad = '/patienten', mitLogo = true) {
  render(
    <MemoryRouter initialEntries={[pfad]}>
      <Seitenleiste mitLogo={mitLogo} />
    </MemoryRouter>,
  )
}

describe('Seitenleiste', () => {
  it('führt alle Bereiche mit vollem Namen und markiert den aktiven', () => {
    zeige('/patienten')
    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' })
    for (const b of BEREICHE) expect(within(nav).getByRole('link', { name: new RegExp(b.titel.replace('.', '\\.')) })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /Pat\.-Liste/ })).toHaveClass('active')
  })

  it('zeigt das Logo nur außerhalb der Startseite', () => {
    zeige('/', false)
    expect(screen.queryByRole('link', { name: 'Zur Startseite' })).toBeNull()
  })

  it('„Mehr“ öffnet Sicherung, Einstellungen/Info und Hell/Dunkel', async () => {
    const nutzer = userEvent.setup()
    zeige()
    const mehr = screen.getByRole('button', { name: 'Mehr' })
    expect(mehr).toHaveAttribute('aria-expanded', 'false')
    await nutzer.click(mehr)
    const menue = document.getElementById('leiste-mehr')!
    expect(within(menue).getByRole('link', { name: 'Sicherung' })).toBeInTheDocument()
    expect(within(menue).getByRole('link', { name: 'Einstellungen/Info' })).toBeInTheDocument()
    expect(within(menue).getByRole('group', { name: 'Darstellung' })).toBeInTheDocument()
  })
})
