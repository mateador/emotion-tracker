import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        // "Steady" is a suggested working name -- easy to change, it's a
        // single field here and doesn't touch any other file.
        name: 'Steady — Emotion Check-In',
        short_name: 'Steady',
        description: 'A gentle, two-tap way to check in with how you\u2019re feeling.',
        theme_color: '#8FBC8F',
        background_color: '#F9F9F7',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // The built app shell (JS/CSS/HTML/icons) is precached automatically
        // by Workbox's generateSW mode -- this is effectively a CacheFirst
        // strategy already, served instantly from cache with no network
        // round-trip. The runtimeCaching rules below cover everything that
        // ISN'T part of that precache manifest: images loaded at runtime,
        // and -- the functionally important one for an offline-capable
        // logging app -- API calls.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [
          {
            // CacheFirst for runtime-loaded images (e.g. any future avatar
            // or illustration assets not part of the initial build output).
            // Fast repeat loads, correct for content that doesn't change
            // once published.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'runtime-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            // NetworkFirst for the API: always attempt a live request first
            // (so a fresh log or the latest 14-day history is never served
            // stale when a connection exists), falling back to the last
            // successful cached response when offline. This is distinct
            // from the offline WRITE queue (Step 5, IndexedDB) -- this rule
            // covers reads; writes made offline are queued separately and
            // synced on reconnect, not silently cached-and-forgotten here.
            urlPattern: ({ url, sameOrigin }) => !sameOrigin && url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 } // 1 day
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts']
  }
})
