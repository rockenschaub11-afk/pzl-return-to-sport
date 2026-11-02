import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { beispielAnlegen } from '../beispiel'
import { db } from '../db'

let endeId: string

beforeEach(async () => {
  await db.patienten.clear()
  await db.testungen.clear()
  const id = await beispielAnlegen()
  endeId = (await db.testungen.where('patientId').equals(id).sortBy('datum'))[2].id
})

const zeige = () =>
  render(
    <MemoryRouter initialEntries={[`/testung/${endeId}`]}>
      <App />
    </MemoryRouter>,
  )

describe('Testung speichern', () => {
  it('schreibt die letzte Eingabe auch beim sofortigen Verlassen', async () => {
    const { unmount } = zeige()
    fireEvent.change(await screen.findByPlaceholderText('z. B. 72,5'), { target: { value: '81' } })
    unmount()
    await waitFor(async () => expect((await db.testungen.get(endeId))?.koerpergewichtKg).toBe('81'))
  })

  it('meldet einen Speicherfehler sichtbar', async () => {
    zeige()
    const feld = await screen.findByPlaceholderText('z. B. 72,5')
    const put = vi.spyOn(db.testungen, 'put').mockRejectedValue(new Error('voll'))
    fireEvent.change(feld, { target: { value: '82' } })
    expect((await screen.findAllByText('! nicht gespeichert – wird wiederholt')).length).toBeGreaterThan(0)
    put.mockRestore()
  })
})
