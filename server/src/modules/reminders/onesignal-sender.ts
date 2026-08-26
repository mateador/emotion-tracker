/**
 * Thin wrapper around OneSignal's REST "Create Notification" API.
 * Verified against current OneSignal docs (api.onesignal.com, not the
 * legacy onesignal.com/api/v1 host) and, for the auth header format
 * specifically, against the API's OWN 401 error message text, which
 * explicitly states the accepted formats: "Authorization: Basic <KEY>" or
 * 'Bearer token="<KEY>"'. Using Basic here as the more broadly and
 * historically consistently documented of the two.
 *
 * Note on terminology: our `users.onesignal_player_id` column stores what
 * OneSignal's current SDK calls a "subscription id"
 * (OneSignal.User.PushSubscription.id client-side) -- "player_id" is the
 * older OneSignal term. Kept the column name for continuity with Step 5
 * rather than a rename-only migration; the REST API field below is
 * correctly `include_subscription_ids`, matching current terminology
 * even though our column name doesn't.
 */

const ONESIGNAL_API_BASE = process.env.ONESIGNAL_API_BASE_URL || 'https://api.onesignal.com'

export interface SendPushResult {
  id: string
  recipients: number
  errors?: string[]
}

export async function sendPushToSubscriptions(
  subscriptionIds: string[],
  heading: string,
  message: string
): Promise<SendPushResult> {
  const appId = process.env.ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_REST_API_KEY
  if (!appId || !apiKey) {
    throw new Error('ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY not configured')
  }
  if (subscriptionIds.length === 0) {
    return { id: '', recipients: 0 }
  }

  const res = await fetch(`${ONESIGNAL_API_BASE}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${apiKey}`
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: 'push',
      include_subscription_ids: subscriptionIds,
      headings: { en: heading },
      contents: { en: message }
    })
  })

  const body = await res.json()
  if (!res.ok) {
    throw new Error(`OneSignal API error (${res.status}): ${JSON.stringify(body)}`)
  }
  return body as SendPushResult
}
