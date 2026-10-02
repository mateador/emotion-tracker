import { useAuthStore } from '../store/auth'
import { queryClient } from '../lib/query-client'
import { Button } from './ui/button'

/**
 * Clears the local session; AuthGate then shows the login form since the
 * token is gone. The query cache is cleared too so the next login never
 * briefly shows the previous account's logs. The offline queue is left
 * alone on purpose so unsynced entries survive and sync after re-login.
 */
export function LogoutButton() {
  const clearSession = useAuthStore((s) => s.clearSession)

  function handleLogout() {
    clearSession()
    queryClient.clear()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      Log out
    </Button>
  )
}
