import { updateOneSignalPlayerId } from './api-client'

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSDK) => void>
  }
}

// Minimal typing for the pieces of the SDK this module actually touches --
// OneSignal doesn't publish official TypeScript types for the Web SDK, so
// this is intentionally narrow rather than an attempt at full coverage.
interface OneSignalSDK {
  init: (options: { appId: string }) => Promise<void>
  Notifications: {
    permission: boolean
    requestPermission: () => Promise<void>
  }
  User: {
    PushSubscription: {
      id: string | null
      addEventListener: (
        event: 'change',
        listener: (event: { current: { id: string | null } }) => void
      ) => void
    }
  }
}

let initialized = false

function loadSdk(appId: string) {
  if (initialized) return
  initialized = true

  const script = document.createElement('script')
  script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
  script.defer = true
  document.head.appendChild(script)

  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({ appId })

    // Whenever the subscription id becomes available -- which may be
    // immediately, or a moment after permission is granted, per
    // OneSignal's own docs recommending the change listener over polling
    // -- save it to the backend.
    OneSignal.User.PushSubscription.addEventListener('change', (event) => {
      if (event.current.id) {
        updateOneSignalPlayerId(event.current.id).catch(() => {
          // Best-effort -- a failed save here doesn't block the person
          // from using the app, and OneSignal will fire this event again
          // on next subscription state change if it matters.
        })
      }
    })

    // Covers the case where a subscription id already existed before this
    // listener was attached (e.g. returning user, already granted
    // earlier).
    if (OneSignal.User.PushSubscription.id) {
      updateOneSignalPlayerId(OneSignal.User.PushSubscription.id).catch(() => {})
    }
  })
}

/**
 * Call this after a natural point of engagement -- NOT on page load. The
 * emotion-tracking context makes an immediate permission prompt on first
 * visit feel presumptuous; asking right after someone's first successful
 * check-in is a much more legible "why is this app asking me this" moment.
 */
export async function requestPushPermission(): Promise<void> {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID
  if (!appId) {
    console.info('[onesignal] VITE_ONESIGNAL_APP_ID not set -- skipping push setup.')
    return
  }
  loadSdk(appId)

  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal) => {
    if (!OneSignal.Notifications.permission) {
      await OneSignal.Notifications.requestPermission()
    }
  })
}
