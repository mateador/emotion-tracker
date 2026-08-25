import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogFlow } from './LogFlow'

describe('LogFlow -- the two-tap logging requirement', () => {
  it('submits with exactly the emotion selected on tap 1, confirmed on tap 2', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LogFlow onSubmit={onSubmit} />)

    // Tap 1: select a POSITIVE emotion
    await user.click(screen.getByRole('button', { name: /calm/i }))

    // Tap 2: confirm
    await user.click(screen.getByRole('button', { name: /log it/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      emotion_type: 'calm_content',
      trigger_tags: []
    })
  })

  it('does NOT show the trigger tagger for a positive emotion', async () => {
    const user = userEvent.setup()
    render(<LogFlow onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /energized/i }))

    expect(screen.queryByText(/contributing to this/i)).not.toBeInTheDocument()
  })

  it('DOES show the trigger tagger for a negative emotion, and it stays optional', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LogFlow onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /anxious/i }))
    expect(screen.getByText(/contributing to this/i)).toBeInTheDocument()

    // Confirm WITHOUT tapping any trigger tag -- must still be a valid
    // two-tap log, per "no mandatory text fields" / tags are optional.
    await user.click(screen.getByRole('button', { name: /log it/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      emotion_type: 'anxious_overwhelmed',
      trigger_tags: []
    })
  })

  it('includes tapped trigger tags in the submitted payload', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LogFlow onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /frustrated/i }))
    await user.click(screen.getByRole('button', { name: 'Workload' }))
    await user.click(screen.getByRole('button', { name: 'Sleep' }))
    await user.click(screen.getByRole('button', { name: /log it/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      emotion_type: 'frustrated_irritated',
      trigger_tags: ['Workload', 'Sleep']
    })
  })

  it('toggling a trigger tag twice removes it from the payload', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LogFlow onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /sad/i }))
    await user.click(screen.getByRole('button', { name: 'Health' }))
    await user.click(screen.getByRole('button', { name: 'Health' })) // toggle off
    await user.click(screen.getByRole('button', { name: /log it/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      emotion_type: 'sad_drained',
      trigger_tags: []
    })
  })

  it('the "Log it" button is disabled until an emotion is selected -- cannot submit on tap 1 alone', () => {
    render(<LogFlow onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /log it/i })).toBeDisabled()
  })

  it('shows a confirmation state after logging, and resets for the next entry', async () => {
    const user = userEvent.setup()
    render(<LogFlow onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /calm/i }))
    await user.click(screen.getByRole('button', { name: /log it/i }))

    await waitFor(() => expect(screen.getByText(/logged/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /log another/i }))
    expect(screen.getByRole('button', { name: /log it/i })).toBeDisabled()
  })
})
