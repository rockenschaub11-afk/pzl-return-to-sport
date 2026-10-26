/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH setzt der Veröffentlichungs-Ablauf für GitHub Pages ("/pzl-return-to-sport/"). Lokal bleibt es "/".
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    // Installierbar und offline (ENTSCHEIDUNGEN F12, Etappe 11): alle Dateien der App werden im Browser vorgehalten.
    // Updates ganz automatisch: neue Version wird sofort aktiv, die Seite lädt neu (Eingaben sind da schon gespeichert).
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo-pzl.svg'],
      manifest: {
        name: 'PZL Return-to-Sport',
        short_name: 'PZL RTS',
        description: 'Return-to-Sport-Testungen nach VKB-Verletzung – Dokumentations- und Rechenhilfe des Physio Zentrum Linz. Daten bleiben auf diesem Gerät.',
        lang: 'de-AT',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#22252b',
        theme_color: '#191b20',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
