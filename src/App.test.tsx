import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'
import { BEREICHE, HINWEIS } from './navigation'

function zeige(pfad: string) {
  render(
    <MemoryRouter initialEntries={[pfad]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App-Rahmen', () => {
  it('zeigt Titel, Logo und den Hinweis „Rechenhilfe“', () => {
    zeige('/')
    expect(screen.getByRole('heading', { level: 1, name: 'PZL Return-to-Sport' })).toBeInTheDocument()
    expect(screen.getByAltText('Physio Zentrum Linz')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(HINWEIS)
  })

  it('hat alle Bereiche in der Navigation', () => {
    zeige('/')
    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' })
    for (const b of BEREICHE) {
      expect(nav).toHaveTextContent(b.titel)
    }
  })

  it('öffnet die gewählte Platzhalterseite', () => {
    zeige('/berichte')
    expect(screen.getByRole('heading', { level: 2, name: 'Berichte' })).toBeInTheDocument()
  })

  it('leitet die Startseite auf die Pat.-Liste um', () => {
    zeige('/')
    expect(screen.getByRole('heading', { level: 2, name: 'Pat.-Liste' })).toBeInTheDocument()
  })
})
