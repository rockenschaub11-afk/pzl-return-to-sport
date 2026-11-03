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

  it('überschreibt keine Änderung aus einem zweiten Fenster und lädt auf Wunsch den aktuellen Stand', async () => {
    zeige()
    const feld = await screen.findByPlaceholderText('z. B. 72,5')
    // zweites Fenster speichert zuerst
    const t = (await db.testungen.get(endeId))!
    await db.testungen.put({ ...t, koerpergewichtKg: '90', geaendertAm: new Date(Date.parse(t.geaendertAm) + 5000).toISOString() })
    fireEvent.change(feld, { target: { value: '60' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('in einem anderen Fenster geändert')
    expect((await db.testungen.get(endeId))?.koerpergewichtKg).toBe('90')
    fireEvent.click(screen.getByRole('button', { name: 'Aktuellen Stand laden' }))
    await waitFor(() => expect(screen.getByPlaceholderText('z. B. 72,5')).toHaveValue('90'))
    expect(screen.queryByRole('alert')).toBeNull()
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
