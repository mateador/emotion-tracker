import { z } from 'zod'
import { EMOTION_TYPES } from '../types/emotion.js'

export const createLogSchema = z.object({
  client_id: z.string().uuid().optional(),
  emotion_type: z.enum(EMOTION_TYPES),
  trigger_tags: z.array(z.string().min(1).max(40)).max(10).optional().default([]),
  notes: z.string().max(1000).optional().nullable()
})

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')

export const dateRangeQuerySchema = z.object({
  start_date: isoDate.optional(),
  end_date: isoDate.optional()
})

export const exportQuerySchema = z.object({
  start_date: isoDate,
  end_date: isoDate
})
