import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
}

interface AuthState {
  token: string | null
  user: User | null
  setSession: (token: string, user: User) => void
  clearSession: () => void
}

// Persisted to localStorage -- the 30-day JWT is meant to survive app
// restarts (this is a home-screen PWA, not a browser tab someone leaves
// open). Bearer-token-in-storage rather than httpOnly cookie was a
// deliberate Step 2 choice specifically to avoid the cross-origin cookie
// complexity (SameSite/Secure/credentials wiring) that came up repeatedly
// in an earlier project in this same session.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null })
    }),
    { name: 'emotion-tracker-auth' }
  )
)
