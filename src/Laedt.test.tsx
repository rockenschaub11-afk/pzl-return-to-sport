import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Laedt from './Laedt'

afterEach(() => vi.useRealTimers())

describe('Ladezustand', () => {
  it('erscheint erst nach 300 ms, damit schnelle Seiten nicht flimmern', () => {
    vi.useFakeTimers()
    render(<Laedt />)
    expect(screen.queryByRole('status')).toBeNull()
    act(() => vi.advanceTimersByTime(300))
    expect(screen.getByRole('status', { name: 'Lädt …' })).toBeInTheDocument()
  })
})
