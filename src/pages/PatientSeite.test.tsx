import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { beispielAnlegen } from '../beispiel'
import { db } from '../db'

let patientId: string

beforeEach(async () => {
  await db.patienten.clear()
  await db.testungen.clear()
  patientId = await beispielAnlegen()
})

function zeige() {
  render(
    <MemoryRouter initialEntries={[`/patienten/${patientId}`]}>
      <App />
    </MemoryRouter>,
  )
}

describe('Seite eines Kürzels', () => {
  it('zeigt zuerst den Stand der letzten Testung – nur vorhandene Aussagen', async () => {
    zeige()
    const stand = await screen.findByRole('region', { name: 'Stand der letzten Testung' })
    expect(stand).toHaveTextContent('Kriterien (noch) nicht erfüllt')
    expect(stand).toHaveTextContent('Vorschlag der App, Endtestung vom')
    expect(stand).toHaveTextContent('SL-Drop-Jump')
    expect(stand).toHaveTextContent('ACL-RSI')
    expect(stand).toHaveTextContent('Ersetzt keine ärztliche Freigabe')
    expect(screen.getByRole('region', { name: 'LSI Knie-Extension (HHD)' })).toHaveTextContent('93,9')
  })

  it('Reiter wechseln, Eingaben im Formular bleiben erhalten', async () => {
    const nutzer = userEvent.setup()
    zeige()
    await screen.findByRole('region', { name: 'Stand der letzten Testung' })
    expect(screen.getByRole('tab', { name: 'Übersicht' })).toHaveAttribute('aria-selected', 'true')

    await nutzer.click(screen.getByRole('tab', { name: 'Stammdaten' }))
    const sportart = await screen.findByDisplayValue('Fußball')
    await nutzer.clear(sportart)
    await nutzer.type(sportart, 'Handball')

    await nutzer.click(screen.getByRole('tab', { name: 'Testungen' }))
    const liste = screen.getByRole('tabpanel')
    expect(within(liste).getAllByRole('link')).toHaveLength(3)
    // kein zweiter „Neue Testung“-Knopf – der steht im Seitenkopf
    expect(screen.getAllByRole('button', { name: 'Neue Testung' })).toHaveLength(1)

    await nutzer.click(screen.getByRole('tab', { name: 'Stammdaten' }))
    expect(screen.getByDisplayValue('Handball')).toBeInTheDocument()
  })
})
