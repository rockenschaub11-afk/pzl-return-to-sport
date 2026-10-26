import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { beispielAnlegen } from '../beispiel'
import { db } from '../db'

let gespeichert: Blob | null = null

beforeEach(async () => {
  await db.patienten.clear()
  await db.testungen.clear()
  await db.einstellungen.clear()
  await beispielAnlegen()
  gespeichert = null
  // jsdom kann nicht herunterladen – wir fangen die Datei ab
  URL.createObjectURL = vi.fn((b: Blob) => {
    gespeichert = b
    return 'blob:test'
  }) as typeof URL.createObjectURL
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => vi.restoreAllMocks())

function zeige(pfad: string) {
  render(
    <MemoryRouter initialEntries={[pfad]}>
      <App />
    </MemoryRouter>,
  )
}

describe('Seite „Sicherung“', () => {
  it('sichert mit Passwort, merkt sich das Datum und führt die Datei wieder zusammen', async () => {
    const nutzer = userEvent.setup()
    zeige('/sicherung')
    expect(await screen.findByText('Noch nie gesichert')).toBeInTheDocument()

    const [pw1, pw2] = [document.getElementById('pw-gesamt-1')!, document.getElementById('pw-gesamt-2')!]
    const knopf = screen.getByRole('button', { name: 'Sicherung herunterladen' })
    await nutzer.type(pw1, 'kurz')
    expect(knopf).toBeDisabled()
    await nutzer.clear(pw1)
    await nutzer.type(pw1, 'geheim-123')
    await nutzer.type(pw2, 'geheim-123')
    await nutzer.click(knopf)

    expect(await screen.findByText(/Gespeichert als „PZL-Sicherung-/, {}, { timeout: 8000 })).toBeInTheDocument()
    expect(await db.einstellungen.get('letzteSicherung')).toBeTruthy()
    const text = await gespeichert!.text()
    expect(text).not.toContain('DEMO-1990')

    // dieselbe Datei wieder öffnen: alles schon da → nichts neu
    await db.testungen.delete((await db.testungen.toArray())[0].id)
    const datei = new File([text], 'PZL-Sicherung.pzlrts')
    await nutzer.upload(screen.getByLabelText(/Datei \(\.pzlrts\)/), datei)
    await nutzer.type(screen.getByLabelText('Passwort der Datei'), 'geheim-123')
    await nutzer.click(screen.getByRole('button', { name: 'Datei öffnen' }))
    expect(await screen.findByText(/Testungen: 1 neu, 0 aktualisiert, 2 unverändert/, {}, { timeout: 8000 })).toBeInTheDocument()
    await nutzer.click(screen.getByRole('button', { name: 'Zusammenführen' }))
    await waitFor(async () => expect(await db.testungen.count()).toBe(3))
  }, 20000)

  it('falsches Passwort wird klar gemeldet', async () => {
    const nutzer = userEvent.setup()
    zeige('/sicherung')
    await screen.findByText('Noch nie gesichert')
    await nutzer.type(document.getElementById('pw-gesamt-1')!, 'geheim-123')
    await nutzer.type(document.getElementById('pw-gesamt-2')!, 'geheim-123')
    await nutzer.click(screen.getByRole('button', { name: 'Sicherung herunterladen' }))
    await screen.findByText(/Gespeichert als/, {}, { timeout: 8000 })

    await nutzer.upload(screen.getByLabelText(/Datei \(\.pzlrts\)/), new File([await gespeichert!.text()], 'x.pzlrts'))
    await nutzer.type(screen.getByLabelText('Passwort der Datei'), 'falsch-falsch')
    await nutzer.click(screen.getByRole('button', { name: 'Datei öffnen' }))
    expect(await screen.findByRole('alert', {}, { timeout: 8000 })).toHaveTextContent('Passwort falsch oder Datei beschädigt.')
  }, 20000)
})
