import { Router } from 'express'
import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { getUsersNeedingReminder, type ReminderWindow } from '../modules/reminders/query.js'
import { sendPushToSubscriptions } from '../modules/reminders/onesignal-sender.js'

const router = Router()

const sendRemindersSchema = z.object({
  window: z.enum(['morning', 'afternoon'])
})

const REMINDER_COPY: Record<ReminderWindow, { heading: string; message: string }> = {
  morning: {
    heading: 'Check in?',
    message: 'A quiet moment to notice how you\u2019re feeling, whenever you\u2019re ready.'
  },
  afternoon: {
    heading: 'Check in?',
    message: 'How\u2019s the afternoon treating you? Two taps, no pressure.'
  }
}

/**
 * Not a user-facing route -- meant to be called by an external scheduler
 * (see the "External Cron Wiring" section of the root README), not a
 * logged-in person's browser. Authenticated with a shared secret rather
 * than the normal JWT middleware, compared in constant time so response
 * timing can't be used to guess the secret character by character.
 */
function isAuthorizedInternalCaller(providedSecret: string | undefined): boolean {
  const expected = process.env.INTERNAL_CRON_SECRET
  if (!expected || !providedSecret) return false
  const a = Buffer.from(providedSecret)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false // timingSafeEqual requires equal-length buffers
  return timingSafeEqual(a, b)
}

router.post('/send-reminders', async (req, res) => {
  if (!isAuthorizedInternalCaller(req.headers['x-internal-secret'] as string | undefined)) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing internal secret' } })
  }

  const parsed = sendRemindersSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message }
    })
  }

  const { window } = parsed.data
  const candidates = await getUsersNeedingReminder(window)
  const copy = REMINDER_COPY[window]

  const result = await sendPushToSubscriptions(
    candidates.map((c) => c.onesignal_player_id),
    copy.heading,
    copy.message
  )

  res.json({ window, candidates: candidates.length, ...result })
})

export default router
