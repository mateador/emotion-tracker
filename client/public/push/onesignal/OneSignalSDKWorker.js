// Scoped deliberately to /push/onesignal/ (see serviceWorkerParam.scope in
// src/lib/onesignal.ts) rather than the site root. The app already has its
// own service worker (Workbox, via vite-plugin-pwa) controlling the whole
// app at root scope for offline caching -- only one service worker can
// control a given scope, and OneSignal's own docs specifically warn about
// this exact collision with an existing PWA service worker. Giving this
// its own subdirectory means neither worker fights the other for control.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
