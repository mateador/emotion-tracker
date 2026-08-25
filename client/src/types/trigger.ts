// Non-exhaustive starter set, per the product brief's "e.g." framing --
// tapped, not typed, so keeping this list short and scannable matters
// more than being comprehensive.
export const TRIGGER_TAGS = [
  'Workload',
  'Conflict',
  'Sleep',
  'Hunger',
  'Health',
  'Finances',
  'Social',
  'Weather'
] as const

export type TriggerTag = (typeof TRIGGER_TAGS)[number]
