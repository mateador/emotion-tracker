import { motion } from 'framer-motion'
import { EMOTIONS, type EmotionType } from '../types/emotion'
import { cn } from '../lib/utils'

interface EmotionSelectorProps {
  selected: EmotionType | null
  onSelect: (type: EmotionType) => void
}

/**
 * Tap 1 of the two-tap logging flow: a grid of 5 large, tappable cards.
 * Selecting a card does NOT submit the log by itself -- it just sets the
 * selection so the person can see what they picked and change their mind
 * before confirming (LogFlow's "Log it" button is tap 2). This is a
 * deliberate choice: an emotion log that can't be undone before it's even
 * saved would work against the "psychological safety" goal, not just the
 * "two taps" one.
 */
export function EmotionSelector({ selected, onSelect }: EmotionSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-label="Select how you're feeling">
      {EMOTIONS.map((emotion) => {
        const Icon = emotion.icon
        const isSelected = selected === emotion.type
        return (
          <motion.button
            key={emotion.type}
            type="button"
            onClick={() => onSelect(emotion.type)}
            aria-pressed={isSelected}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-surface px-4 py-6 transition-colors',
              isSelected ? 'border-transparent' : 'border-surface-muted hover:border-slate/40'
            )}
            style={
              isSelected
                ? { backgroundColor: emotion.colorVar, borderColor: emotion.colorVar }
                : undefined
            }
          >
            <Icon
              className="h-8 w-8"
              strokeWidth={1.75}
              style={{ color: isSelected ? '#FFFFFF' : emotion.colorVar }}
            />
            <span
              className={cn(
                'text-sm font-medium',
                isSelected ? 'text-white' : 'text-text'
              )}
            >
              {emotion.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
