import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Nach jedem Test die gerenderte Seite wieder entfernen
afterEach(() => cleanup())
