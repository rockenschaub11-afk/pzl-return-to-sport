import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Frage from '../Frage'
import { einheitFest } from '../testung/erfassung'
import { nachBloecken, VERLAUF_OPTIONEN } from '../testung/verlauf'
import { useUngespeichertWarnung } from './ungespeichert'

function Seite({ aktiv }: { aktiv: boolean }) {
  useUngespeichertWarnung(aktiv)
  return <a href="#/weg">weg</a>
}

describe('Warnung vor ungespeicherten Änderungen', () => {
  it('fragt bei einem Link nur, wenn etwas ungespeichert ist', () => {
    const frage = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { rerender } = render(<Seite aktiv={false} />)
    fireEvent.click(screen.getByText('weg'))
    expect(frage).not.toHaveBeenCalled()
    rerender(<Seite aktiv />)
    const klick = new MouseEvent('click', { bubbles: true, cancelable: true })
    screen.getByText('weg').dispatchEvent(klick)
    expect(frage).toHaveBeenCalledOnce()
    expect(klick.defaultPrevented).toBe(true)
    frage.mockRestore()
  })
})

describe('Rückfrage', () => {
  it('setzt den Fokus auf die sichere Antwort, Esc bricht ab', () => {
    const abbrechen = vi.fn()
    render(
      <Frage className="x" label="Löschen bestätigen" onAbbrechen={abbrechen}>
        <button>Ja</button>
        <button data-abbrechen>Nein</button>
      </Frage>,
    )
    expect(screen.getByText('Nein')).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })
    expect(abbrechen).toHaveBeenCalledOnce()
  })
})

describe('Anzeige-Helfer', () => {
  it('hält Zahl und Einheit zusammen, ändert sonst nichts', () => {
    expect(einheitFest('LSI 89,7 % – Ziel ≥ 90 %')).toBe('LSI 89,7 % – Ziel ≥ 90 %')
    expect(einheitFest('7,8 N/kg')).toBe('7,8 N/kg')
    expect(einheitFest('12 von 13')).toBe('12 von 13')
    expect(einheitFest('Box 15 kgfoo')).toBe('Box 15 kgfoo')
  })

  it('gruppiert die Verlaufsauswahl nach Block, ohne etwas zu verlieren', () => {
    const g = nachBloecken(VERLAUF_OPTIONEN)
    expect(g.flatMap((x) => x.optionen)).toHaveLength(VERLAUF_OPTIONEN.length)
    expect(g.map((x) => x.name)).toContain('Handdynamometer (HHD)')
  })
})
