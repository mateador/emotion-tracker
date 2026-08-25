import type { EmotionType } from './emotion'

export interface EmotionLog {
  id: string
  emotion_type: EmotionType
  trigger_tags: string[]
  notes: string | null
  logged_at: string
}
