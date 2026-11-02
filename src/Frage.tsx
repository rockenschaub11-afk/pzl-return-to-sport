// Rückfrage in der Seite (Löschen, Wieder öffnen): Fokus geht auf die sichere Antwort, Esc bricht ab, danach zurück zum Auslöser.

import { useEffect, useRef, type ReactNode } from 'react'

export default function Frage({ className, label, onAbbrechen, children }: { className: string; label: string; onAbbrechen: () => void; children: ReactNode }) {
  const rahmen = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const vorher = document.activeElement as HTMLElement | null
    rahmen.current?.querySelector<HTMLElement>('[data-abbrechen]')?.focus()
    return () => {
      if (vorher?.isConnected) vorher.focus()
    }
  }, [])
  return (
    <div
      ref={rahmen}
      className={className}
      role="alertdialog"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onAbbrechen()
      }}
    >
      {children}
    </div>
  )
}
