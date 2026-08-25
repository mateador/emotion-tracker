import { Waves, Sun, CloudDrizzle, Wind, Cloud, type LucideIcon } from 'lucide-react'

export const EMOTION_TYPES = [
  'calm_content',
  'energized_focused',
  'anxious_overwhelmed',
  'frustrated_irritated',
  'sad_drained'
] as const

export type EmotionType = (typeof EMOTION_TYPES)[number]

export interface EmotionMeta {
  type: EmotionType
  label: string
  icon: LucideIcon
  /** Tailwind color token from index.css's @theme block */
  colorVar: string
  /** Negative emotions trigger the optional trigger-tag cloud */
  negative: boolean
}

// Icon choices follow the design brief's own suggestions where given
// (gentle wave for Calm, soft sun for Energized, soft cloud for Sad) and
// extend the same gentle weather/nature visual language for the two
// states the brief didn't specify an icon for.
export const EMOTIONS: EmotionMeta[] = [
  {
    type: 'calm_content',
    label: 'Calm',
    icon: Waves,
    colorVar: 'var(--color-emotion-calm)',
    negative: false
  },
  {
    type: 'energized_focused',
    label: 'Energized',
    icon: Sun,
    colorVar: 'var(--color-emotion-energized)',
    negative: false
  },
  {
    type: 'anxious_overwhelmed',
    label: 'Anxious',
    icon: CloudDrizzle,
    colorVar: 'var(--color-emotion-anxious)',
    negative: true
  },
  {
    type: 'frustrated_irritated',
    label: 'Frustrated',
    icon: Wind,
    colorVar: 'var(--color-emotion-frustrated)',
    negative: true
  },
  {
    type: 'sad_drained',
    label: 'Sad',
    icon: Cloud,
    colorVar: 'var(--color-emotion-sad)',
    negative: true
  }
]

export function getEmotionMeta(type: EmotionType): EmotionMeta {
  const meta = EMOTIONS.find((e) => e.type === type)
  if (!meta) throw new Error(`Unknown emotion type: ${type}`)
  return meta
}
