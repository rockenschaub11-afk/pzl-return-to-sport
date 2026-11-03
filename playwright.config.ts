// End-to-End-Tests (e2e/). Start: npm run e2e – Bericht danach: npm run e2e:bericht
// Getestet wird die gebaute App (wie auf GitHub Pages) auf eigenem Port 5175 – nie ein anderer laufender Stand.
// Der Entwicklungsserver eignet sich nicht: Beim ersten Aufruf hält er Anfragen fest, bis seine Pakete aufbereitet sind.
// Jeder Test bekommt einen frischen Browser-Speicher (IndexedDB) – echte Daten werden nie berührt.

import { defineConfig, devices } from '@playwright/test'

const PORT = 5175

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : 3,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    // ruhige Screenshots: Kurven und LSI-Punkte werden nicht animiert
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    // Service Worker aus: jeder Test lädt frisch vom Server, nichts aus einem Zwischenspeicher
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'laptop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
