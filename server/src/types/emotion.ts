export const EMOTION_TYPES = [
  'calm_content',
  'energized_focused',
  'anxious_overwhelmed',
  'frustrated_irritated',
  'sad_drained',
] as const

export type EmotionType = (typeof EMOTION_TYPES)[number]

// Used by the frontend to decide whether to show the trigger-tag cloud --
// kept here rather than duplicated client-side, single source of truth.
export const NEGATIVE_EMOTIONS: readonly EmotionType[] = [
  'anxious_overwhelmed',
  'frustrated_irritated',
  'sad_drained',
]
