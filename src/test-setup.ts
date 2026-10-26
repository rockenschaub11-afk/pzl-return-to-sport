import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom kann nicht zeichnen – die Startseite verzichtet dann einfach auf den Monitor
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext

// jsdom kennt kein Scrollen – Sprungmarken tun im Test einfach nichts
Element.prototype.scrollIntoView = () => {}

// Nach jedem Test die gerenderte Seite wieder entfernen
afterEach(() => cleanup())
