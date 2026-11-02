import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Auffangnetz from './Auffangnetz'

function Kaputt(): never {
  throw new Error('Test')
}

describe('Auffangnetz', () => {
  it('zeigt bei einem Anzeigefehler einen Ausweg statt einer leeren Seite', () => {
    const still = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <Auffangnetz>
        <Kaputt />
      </Auffangnetz>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Bereits gespeicherte Eingaben')
    expect(screen.getByRole('button', { name: 'Seite neu laden' })).toBeInTheDocument()
    still.mockRestore()
  })

  it('zeigt ohne Fehler einfach den Inhalt', () => {
    render(
      <Auffangnetz>
        <p>Inhalt</p>
      </Auffangnetz>,
    )
    expect(screen.getByText('Inhalt')).toBeInTheDocument()
  })
})
