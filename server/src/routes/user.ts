import { Router } from 'express'
import { pool } from '../db/pool.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { onesignalPlayerIdSchema } from '../schemas/user.schema.js'

const router = Router()

router.patch('/onesignal-player-id', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = onesignalPlayerIdSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message }
    })
  }
  await pool.query('UPDATE users SET onesignal_player_id = $1 WHERE id = $2', [
    parsed.data.player_id,
    req.userId
  ])
  res.json({ status: 'ok' })
})

export default router
