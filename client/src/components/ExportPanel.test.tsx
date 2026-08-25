import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportPanel } from './ExportPanel'

describe('ExportPanel', () => {
  it('disables Export CSV until a full date range is chosen', () => {
    render(<ExportPanel onExport={vi.fn()} />)
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled()
  })

  it('opens the calendar popover on trigger click', async () => {
    const user = userEvent.setup()
    render(<ExportPanel onExport={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /choose a date range/i }))

    // react-day-picker renders a grid of day buttons once open -- this
    // confirms the Radix Popover portal + Calendar actually mounted,
    // not just that the trigger button exists.
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(20)
  })
})
