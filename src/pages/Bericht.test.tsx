import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { beispielAnlegen } from '../beispiel'
import { db } from '../db'

function zeige(pfad: string) {
  render(
    <MemoryRouter initialEntries={[pfad]}>
      <App />
    </MemoryRouter>,
  )
}

let endeId: string

beforeEach(async () => {
  await db.patienten.clear()
  await db.testungen.clear()
  await db.einstellungen.clear()
  localStorage.clear()
  sessionStorage.clear()
  const id = await beispielAnlegen()
  const t = await db.testungen.where('patientId').equals(id).sortBy('datum')
  endeId = t[2].id
})

/** Alles, was die App gespeichert hat – IndexedDB und Browser-Speicher. */
async function allesGespeichert(): Promise<string> {
  const tabellen = await Promise.all(db.tables.map((t) => t.toArray()))
  return JSON.stringify({ tabellen, localStorage: { ...localStorage }, sessionStorage: { ...sessionStorage } })
}

describe('Berichte', () => {
  it('Menü „Berichte“ listet die Testungen mit beiden Berichten', async () => {
    zeige('/berichte')
    expect(await screen.findAllByRole('link', { name: 'Arztbericht' })).toHaveLength(3)
    expect(screen.getAllByRole('link', { name: 'Pat./Trainer-Bericht' })).toHaveLength(3)
  })

  it('Knopf „Bericht“ in der Testung führt zum Arztbericht', async () => {
    zeige(`/testung/${endeId}`)
    const link = await screen.findByRole('link', { name: 'Bericht' })
    expect(link).toHaveAttribute('href', `/berichte/${endeId}/arzt`)
  })

  it('Name erscheint nur im Bericht und wird nie gespeichert', async () => {
    const nutzer = userEvent.setup()
    zeige(`/berichte/${endeId}/arzt`)
    const bericht = await screen.findByRole('article', { name: 'Arztbericht' })
    const feld = screen.getByLabelText(/Name für den Ausdruck/)
    expect(feld).toHaveAttribute('autocomplete', 'off')
    await nutzer.type(feld, 'Maximiliane Testperson')
    expect(bericht).toHaveTextContent('Maximiliane Testperson')
    expect(bericht).toHaveTextContent('DEMO-1990')
    expect(bericht).toHaveTextContent('ENTWURF')
    expect(bericht).toHaveTextContent('Ersetzt keine ärztliche Freigabe')
    // auch der Wechsel zum Pat./Trainer-Bericht speichert nichts
    await nutzer.click(screen.getByRole('link', { name: 'Pat./Trainer-Bericht' }))
    expect(await screen.findByRole('article', { name: 'Pat./Trainer-Bericht' })).toHaveTextContent('Maximiliane Testperson')
    await new Promise((r) => setTimeout(r, 600))
    expect(await allesGespeichert()).not.toMatch(/Maximiliane|Testperson/)
    expect(document.title).not.toMatch(/Maximiliane/)
  })

  it('Drucken öffnet den Druckdialog des Browsers', async () => {
    const drucken = vi.spyOn(window, 'print').mockImplementation(() => {})
    const nutzer = userEvent.setup()
    zeige(`/berichte/${endeId}/pat`)
    await screen.findByRole('article', { name: 'Pat./Trainer-Bericht' })
    expect(screen.getByRole('img', { name: /Spinnennetz/ })).toBeInTheDocument()
    await nutzer.click(screen.getByRole('button', { name: /Drucken/ }))
    expect(drucken).toHaveBeenCalledOnce()
    drucken.mockRestore()
  })

  it('Arztbericht zeigt Verlauf und Unterschriftfeld', async () => {
    zeige(`/berichte/${endeId}/arzt`)
    const bericht = await screen.findByRole('article', { name: 'Arztbericht' })
    await waitFor(() => expect(bericht).toHaveTextContent('Verlauf'))
    expect(bericht).toHaveTextContent('Unterschrift Therapeut:in')
    expect(bericht).toHaveTextContent('Kriterien (noch) nicht erfüllt')
  })
})
