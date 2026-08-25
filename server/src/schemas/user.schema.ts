import { z } from 'zod'

export const onesignalPlayerIdSchema = z.object({
  player_id: z.string().min(1)
})
