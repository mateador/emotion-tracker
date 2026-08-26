import { pool } from '../../db/pool.js'

export type ReminderWindow = 'morning' | 'afternoon'

/**
 * V1 simplification, flagged explicitly rather than silently assumed:
 * this uses fixed UTC time boundaries (00:00 UTC for the morning window,
 * 12:00 UTC for the afternoon window) as a stand-in for "today's two
 * check-in periods." There is no per-user timezone stored anywhere in
 * this schema, so "11:30 AM" and "4:30 PM" from the product brief can't
 * actually be localized per person yet -- someone several hours off UTC
 * will see these windows land at a different local time than intended.
 * A real fix needs a `users.timezone` column and per-user-aware
 * scheduling; this is a reasonable approximation until that's built, not
 * a finished solution.
 */
export function windowStartUtc(window: ReminderWindow, now: Date = new Date()): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (window === 'afternoon') {
    start.setUTCHours(12)
  }
  return start
}

export interface ReminderCandidate {
  id: string
  onesignal_player_id: string
}

/**
 * Users who (a) have a push subscription saved, and (b) have not logged
 * any emotion since the start of the given window -- i.e. genuinely
 * haven't checked in yet for this specific window, not "haven't logged
 * at all today." This is the query that makes the reminder respect the
 * app's own psychological-safety framing: someone who already checked in
 * this window is never re-nagged.
 */
export async function getUsersNeedingReminder(
  window: ReminderWindow,
  now: Date = new Date()
): Promise<ReminderCandidate[]> {
  const since = windowStartUtc(window, now)
  const result = await pool.query<ReminderCandidate>(
    `SELECT id, onesignal_player_id
     FROM users
     WHERE onesignal_player_id IS NOT NULL
       AND id NOT IN (
         SELECT DISTINCT user_id FROM emotion_logs WHERE logged_at >= $1
       )`,
    [since]
  )
  return result.rows
}
