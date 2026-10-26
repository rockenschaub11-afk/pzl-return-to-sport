import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom kann nicht zeichnen – die Startseite verzichtet dann einfach auf den Monitor
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext

// jsdom kennt kein Scrollen – Sprungmarken tun im Test einfach nichts
Element.prototype.scrollIntoView = () => {}

// Nach jedem Test die gerenderte Seite wieder entfernen
afterEach(() => cleanup())

// Seiten mit vielen Berechnungen brauchen bei voller Testlast länger als 1 s – mehr Geduld beim Warten (findBy…, waitFor)
configure({ asyncUtilTimeout: 4000 })
