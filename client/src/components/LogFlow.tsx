import { useState } from 'react'
import { motion } from 'framer-motion'
import { EmotionSelector } from './EmotionSelector'
import { TriggerTagger } from './TriggerTagger'
import { Button } from './ui/button'
import { getEmotionMeta, type EmotionType } from '../types/emotion'

export interface LogPayload {
  emotion_type: EmotionType
  trigger_tags: string[]
}

interface LogFlowProps {
  onSubmit: (payload: LogPayload) => void | Promise<void>
}

/**
 * The two-tap logging flow, end to end:
 *   Tap 1 -- select an emotion card (EmotionSelector)
 *   Tap 2 -- "Log it" (this component's confirm button)
 * Trigger tags are optional extra taps in between, never required to
 * reach submission -- selecting zero tags and tapping "Log it" is a
 * fully valid two-tap log.
 */
export function LogFlow({ onSubmit }: LogFlowProps) {
  const [selected, setSelected] = useState<EmotionType | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [justLogged, setJustLogged] = useState(false)

  const isNegative = selected ? getEmotionMeta(selected).negative : false

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function handleConfirm() {
    if (!selected) return
    setSubmitting(true)
    try {
      await onSubmit({ emotion_type: selected, trigger_tags: tags })
      setSelected(null)
      setTags([])
      setJustLogged(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (justLogged) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl bg-surface-muted p-6 text-center"
      >
        <p className="text-text">Logged. Thank you for checking in.</p>
        <button
          type="button"
          onClick={() => setJustLogged(false)}
          className="mt-3 text-sm text-slate underline underline-offset-2"
        >
          Log another
        </button>
      </motion.div>
    )
  }

  return (
    <div>
      <EmotionSelector selected={selected} onSelect={setSelected} />
      <TriggerTagger visible={isNegative} selectedTags={tags} onToggleTag={toggleTag} />
      <Button
        type="button"
        disabled={!selected || submitting}
        onClick={handleConfirm}
        className="mt-5 w-full"
      >
        {submitting ? 'Logging…' : 'Log it'}
      </Button>
    </div>
  )
}
