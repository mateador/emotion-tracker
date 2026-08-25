import { useState } from 'react'
import { registerAccount, loginAccount, ApiError } from '../lib/api-client'
import { useAuthStore } from '../store/auth'
import { Button } from './ui/button'

/**
 * Not one of Step 4's named components -- the original plan didn't include
 * a login/register screen anywhere in Steps 1-6, but the app has no way to
 * obtain a JWT without one. Kept intentionally minimal: this is connective
 * tissue to make the rest of Step 5 demonstrable, not a design-considered
 * onboarding flow. Worth revisiting with the same psychological-safety
 * care given to the rest of the UI if this becomes real product surface.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { token, setSession } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (token) return <>{children}</>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result =
        mode === 'login' ? await loginAccount(email, password) : await registerAccount(email, password)
      setSession(result.token, result.user)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="mb-4 text-xl font-semibold text-text">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        {error && <p className="text-sm text-emotion-anxious">{error}</p>}
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-surface-muted bg-surface px-3 py-2 outline-none focus:border-slate"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-surface-muted bg-surface px-3 py-2 outline-none focus:border-slate"
        />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="w-full text-center text-sm text-text-muted underline underline-offset-2"
        >
          {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
