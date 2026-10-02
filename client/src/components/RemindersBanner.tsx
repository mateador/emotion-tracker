import { useEffect, useState } from 'react'
import { getPushState, initPush, requestPushPermission, type PushState } from '../lib/onesignal'
import { Button } from './ui/button'

const DISMISS_KEY = 'emotion-tracker-reminders-dismissed-at'
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return Boolean(at) && Date.now() - at < DISMISS_MS
  } catch {
    return false
  }
}

/**
 * Explicit opt-in for push reminders. Permission is only ever requested
 * from the button's tap (Safari/iOS require a user gesture). The browser
 * can't re-prompt after a denial, so that state just explains where to
 * change it.
 */
export function RemindersBanner() {
  const [state, setState] = useState<PushState>(getPushState)
  const [dismissed, setDismissed] = useState(recentlyDismissed)
  const [asking, setAsking] = useState(false)

  // Load the SDK ahead of the tap (and sync the subscription id for people
  // who already granted). Skipped when nothing can be asked or synced.
  useEffect(() => {
    if (state === 'default' || state === 'granted') initPush()
  }, [state])

  if (state === 'unsupported' || state === 'granted' || dismissed) return null

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // Storage unavailable -- just hide it for this session.
    }
    setDismissed(true)
  }

  async function handleTurnOn() {
    setAsking(true)
    try {
      setState(await requestPushPermission())
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-surface-muted bg-surface p-3">
      {state === 'default' ? (
        <>
          <p className="text-sm text-text-muted">Want a gentle nudge to check in?</p>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={handleTurnOn} disabled={asking}>
              Turn on reminders
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-text-muted">
            Reminders are blocked. You can turn them on in your browser or phone settings.
          </p>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Dismiss
          </Button>
        </>
      )}
    </div>
  )
}
