import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { db } from './db'
import { BEREICHE, HINWEIS } from './navigation'

function zeige(pfad: string) {
  render(
    <MemoryRouter initialEntries={[pfad]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await db.patienten.clear()
})

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

  it('zeigt auf der Startseite den Live-Monitor ohne Knöpfe und ohne Zahlen', () => {
    zeige('/')
    const startseite = screen.getByRole('heading', { level: 1 }).closest('section')!
    expect(startseite.querySelector('canvas.start-monitor')).toBeInTheDocument()
    expect(startseite.querySelector('a, button')).toBeNull()
    expect(startseite).not.toHaveTextContent(/\d/)
  })

  it('zeigt auf den übrigen Seiten den Kopf mit Logo-Link zur Startseite', () => {
    zeige('/berichte')
    expect(screen.getByRole('link', { name: 'Zur Startseite' })).toHaveAttribute('href', '/')
  })

  it('leitet unbekannte Adressen auf die Startseite um', () => {
    zeige('/gibt-es-nicht')
    expect(screen.getByRole('heading', { level: 1, name: 'PZL Return-to-Sport' })).toBeInTheDocument()
  })
})

describe('Pat.-Liste', () => {
  it('legt ein Kürzel an und erkennt danach die Dublette', async () => {
    const user = userEvent.setup()
    zeige('/patienten/neu')

    await user.type(await screen.findByPlaceholderText('MH-1998'), 'mh-1998')
    await user.click(screen.getByRole('button', { name: 'Links' }))
    await user.click(screen.getByRole('button', { name: 'Wettkampf' }))
    fireEvent.change(screen.getByLabelText('OP-Datum'), { target: { value: '2025-12-01' } })
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(await screen.findByText('1 Kürzel auf diesem Laptop')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /MH-1998/ })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '+ Neues Kürzel' }))
    await user.type(await screen.findByPlaceholderText('MH-1998'), 'MH-1998')
    expect(await screen.findByRole('alert')).toHaveTextContent('ist schon angelegt')
    await user.click(screen.getByRole('button', { name: 'MH-1998-2 verwenden' }))
    expect(screen.getByPlaceholderText('MH-1998')).toHaveValue('MH-1998-2')
  })

  it('speichert nicht ohne Pflichtfelder', async () => {
    const user = userEvent.setup()
    zeige('/patienten/neu')
    await user.click(await screen.findByRole('button', { name: 'Speichern' }))
    expect(screen.getByText('Bitte die rot markierten Felder prüfen.')).toBeInTheDocument()
    expect(await db.patienten.count()).toBe(0)
  })
})
