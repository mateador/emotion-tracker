import type { ComponentProps, CSSProperties } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { cn } from '../../lib/utils'

export type CalendarProps = ComponentProps<typeof DayPicker>

/**
 * Thin themed wrapper around react-day-picker v10. v10 exposes theming via
 * CSS custom properties (--rdp-*) on .rdp-root rather than the older
 * per-part classNames overrides shadcn's calendar used against v8 -- this
 * wrapper targets v10's actual current API rather than an outdated one.
 */
export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn('rdp-sage', className)}
      style={
        {
          '--rdp-accent-color': 'var(--color-sage-dark)',
          '--rdp-accent-background-color': 'var(--color-surface-muted)',
          '--rdp-today-color': 'var(--color-slate)',
          '--rdp-day-height': '2.25rem',
          '--rdp-day-width': '2.25rem'
        } as CSSProperties
      }
      {...props}
    />
  )
}
