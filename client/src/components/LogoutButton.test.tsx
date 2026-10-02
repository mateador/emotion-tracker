import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthGate } from './AuthGate'
import { LogoutButton } from './LogoutButton'
import { useAuthStore } from '../store/auth'

describe('LogoutButton', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('token', { id: '1', email: 'a@b.com' })
  })

  it('clears the session and returns to the login form', async () => {
    const user = userEvent.setup()
    render(
      <AuthGate>
        <LogoutButton />
      </AuthGate>
    )

    await user.click(screen.getByRole('button', { name: /log out/i }))

    expect(useAuthStore.getState().token).toBeNull()
    expect(screen.getByText(/welcome back/i)).toBeTruthy()
  })
})
