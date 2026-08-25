import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../db/pool.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'

const router = Router()

// Long-lived token, appropriate for a home-screen PWA context where
// re-authenticating every few hours would be genuine friction against the
// "two taps to log an emotion" goal. A refresh-token rotation scheme is a
// reasonable v2 addition if this ever needs tighter session control.
const TOKEN_TTL = '30d'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return secret
}

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message }
    })
  }
  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase()

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
  if (existing.rows.length > 0) {
    return res.status(409).json({
      error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' }
    })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const result = await pool.query<{ id: string; email: string }>(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [normalizedEmail, passwordHash]
  )
  const user = result.rows[0]
  const token = jwt.sign({ sub: user.id }, getJwtSecret(), { expiresIn: TOKEN_TTL })
  res.status(201).json({ token, user: { id: user.id, email: user.email } })
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message }
    })
  }
  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase()

  const result = await pool.query<{ id: string; email: string; password_hash: string }>(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [normalizedEmail]
  )
  const user = result.rows[0]

  // Deliberately identical error for "no such user" and "wrong password" --
  // distinguishing them would let a client enumerate which emails have
  // accounts.
  const invalidCredentials = () =>
    res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    })

  if (!user) return invalidCredentials()
  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) return invalidCredentials()

  const token = jwt.sign({ sub: user.id }, getJwtSecret(), { expiresIn: TOKEN_TTL })
  res.json({ token, user: { id: user.id, email: user.email } })
})

export default router
