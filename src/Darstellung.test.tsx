import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import DarstellungUmschalter, { DARSTELLUNG_SCHLUESSEL, gespeicherteDarstellung } from './Darstellung'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('Hell/Dunkel', () => {
  it('ist standardmäßig dunkel', () => {
    render(<DarstellungUmschalter />)
    expect(gespeicherteDarstellung()).toBe('dunkel')
    expect(screen.getByRole('button', { name: 'Dunkel' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('schaltet um und merkt sich nur die Darstellung', async () => {
    const nutzer = userEvent.setup()
    render(<DarstellungUmschalter />)
    await nutzer.click(screen.getByRole('button', { name: 'Hell' }))
    expect(document.documentElement.dataset.theme).toBe('hell')
    expect(screen.getByRole('button', { name: 'Hell' })).toHaveAttribute('aria-pressed', 'true')
    expect({ ...localStorage }).toEqual({ [DARSTELLUNG_SCHLUESSEL]: 'hell' })
    await nutzer.click(screen.getByRole('button', { name: 'Dunkel' }))
    expect(document.documentElement.dataset.theme).toBe('dunkel')
  })
})
