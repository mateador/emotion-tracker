import { AnimatePresence, motion } from 'framer-motion'
import { TRIGGER_TAGS } from '../types/trigger'
import { cn } from '../lib/utils'

interface TriggerTaggerProps {
  visible: boolean
  selectedTags: string[]
  onToggleTag: (tag: string) => void
}

/**
 * Only rendered when a negative emotion is selected (visible=false when
 * the parent unmounts nothing, so this component owns its own
 * slide/fade transition rather than the parent conditionally rendering
 * it, which would skip the exit animation).
 *
 * Entirely optional: tags are tappable chips, not a form. The log can be
 * submitted with zero tags selected -- this never becomes a mandatory
 * step, matching "no mandatory text fields" from the product brief.
 */
export function TriggerTagger({ visible, selectedTags, onToggleTag }: TriggerTaggerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="pt-4">
            <p className="mb-2 text-sm text-text-muted">
              What&apos;s contributing to this? <span className="italic">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Optional trigger tags">
              {TRIGGER_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag)
                return (
                  <motion.button
                    key={tag}
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    aria-pressed={isSelected}
                    whileTap={{ scale: 0.94 }}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      isSelected
                        ? 'border-slate bg-slate text-white'
                        : 'border-surface-muted bg-surface text-text-muted hover:border-slate/50'
                    )}
                  >
                    {tag}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
