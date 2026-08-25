import { Router } from 'express'
import { pool } from '../db/pool.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { createLogSchema, dateRangeQuerySchema, exportQuerySchema } from '../schemas/logs.schema.js'

const router = Router()

router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createLogSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message }
    })
  }
  const { client_id, emotion_type, trigger_tags, notes } = parsed.data

  if (client_id) {
    const existing = await pool.query(
      `SELECT id, emotion_type, trigger_tags, notes, logged_at
       FROM emotion_logs WHERE client_id = $1`,
      [client_id]
    )
    if (existing.rows.length > 0) {
      // Same client_id already landed -- this is a retried sync of a
      // request whose response was lost, not a new log. Return the
      // existing row rather than creating a duplicate.
      return res.status(200).json({ log: existing.rows[0], deduped: true })
    }
  }

  const result = await pool.query(
    `INSERT INTO emotion_logs (client_id, user_id, emotion_type, trigger_tags, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, emotion_type, trigger_tags, notes, logged_at`,
    [client_id ?? null, req.userId, emotion_type, trigger_tags, notes ?? null]
  )
  res.status(201).json({ log: result.rows[0] })
})

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = dateRangeQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message }
    })
  }
  const { start_date, end_date } = parsed.data

  // Default window: last 14 days, per the dashboard's core requirement --
  // callers can override with explicit start_date/end_date for the
  // custom-range view.
  const effectiveStart =
    start_date ?? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const effectiveEnd = end_date ?? new Date().toISOString().slice(0, 10)

  const result = await pool.query(
    `SELECT id, emotion_type, trigger_tags, notes, logged_at
     FROM emotion_logs
     WHERE user_id = $1 AND logged_at::date >= $2 AND logged_at::date <= $3
     ORDER BY logged_at DESC`,
    [req.userId, effectiveStart, effectiveEnd]
  )
  res.json({ logs: result.rows })
})

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

router.get('/export', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = exportQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message }
    })
  }
  const { start_date, end_date } = parsed.data

  const result = await pool.query<{
    emotion_type: string
    trigger_tags: string[]
    notes: string | null
    logged_at: string
  }>(
    `SELECT emotion_type, trigger_tags, notes, logged_at
     FROM emotion_logs
     WHERE user_id = $1 AND logged_at::date >= $2 AND logged_at::date <= $3
     ORDER BY logged_at ASC`,
    [req.userId, start_date, end_date]
  )

  const header = ['Date', 'Time', 'Emotion', 'Triggers', 'Notes']
  const rows = result.rows.map((row) => {
    const logged = new Date(row.logged_at)
    return [
      logged.toISOString().slice(0, 10),
      logged.toISOString().slice(11, 16),
      row.emotion_type,
      (row.trigger_tags || []).join('; '),
      row.notes ?? ''
    ]
  })

  const csv = [header, ...rows]
    .map((fields) => fields.map((f) => escapeCsvField(String(f))).join(','))
    .join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="emotion-log-${start_date}-to-${end_date}.csv"`
  )
  res.send(csv)
})

export default router
