import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RemindersBanner } from './RemindersBanner'
import * as push from '../lib/onesignal'

vi.mock('../lib/onesignal', () => ({
  getPushState: vi.fn(),
  initPush: vi.fn(),
  requestPushPermission: vi.fn()
}))

const mocked = vi.mocked(push)

describe('RemindersBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('offers the opt-in when permission has not been asked, and requests on tap', async () => {
    const user = userEvent.setup()
    mocked.getPushState.mockReturnValue('default')
    mocked.requestPushPermission.mockResolvedValue('granted')
    render(<RemindersBanner />)

    expect(mocked.initPush).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /turn on reminders/i }))

    expect(mocked.requestPushPermission).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByText(/gentle nudge/i)).toBeNull())
  })

  it('shows a settings hint when blocked', () => {
    mocked.getPushState.mockReturnValue('denied')
    render(<RemindersBanner />)
    expect(screen.getByText(/reminders are blocked/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /turn on reminders/i })).toBeNull()
  })

  it.each(['granted', 'unsupported'] as const)('renders nothing when %s', (state) => {
    mocked.getPushState.mockReturnValue(state)
    const { container } = render(<RemindersBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('hides after "Not now" and stays hidden on remount', async () => {
    const user = userEvent.setup()
    mocked.getPushState.mockReturnValue('default')
    const { unmount } = render(<RemindersBanner />)
    await user.click(screen.getByRole('button', { name: /not now/i }))
    expect(screen.queryByText(/gentle nudge/i)).toBeNull()

    unmount()
    render(<RemindersBanner />)
    expect(screen.queryByText(/gentle nudge/i)).toBeNull()
  })
})
