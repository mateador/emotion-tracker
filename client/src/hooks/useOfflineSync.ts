import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createLog, ApiError } from '../lib/api-client'
import { getQueuedLogs, removeQueuedLog, markQueuedLogFailed } from '../lib/offline-db'

/**
 * Mounted once near the app root. Flushes the offline queue whenever the
 * browser reports it's back online, and once on mount in case the app was
 * closed while offline and reopened later while already connected (the
 * 'online' event won't fire retroactively for that case).
 */
export function useOfflineSync() {
  const queryClient = useQueryClient()
  const syncing = useRef(false)

  useEffect(() => {
    async function flush() {
      if (syncing.current) return
      syncing.current = true
      try {
        const queued = getUnfailedOnly(await getQueuedLogs())
        for (const item of queued) {
          try {
            await createLog({
              client_id: item.client_id,
              emotion_type: item.emotion_type,
              trigger_tags: item.trigger_tags,
              notes: item.notes
            })
            await removeQueuedLog(item.client_id)
          } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
              // Session expired while offline -- stop trying entirely
              // rather than looping through the rest of the queue against
              // a token that will keep failing the same way.
              return
            }
            if (err instanceof ApiError) {
              // A real, permanent rejection (e.g. the emotion_type
              // somehow became invalid) -- mark it rather than retrying
              // forever on every future reconnect.
              await markQueuedLogFailed(item.client_id, err.message)
            }
            // Plain network errors: leave it queued silently, next
            // reconnect will retry it.
          }
        }
        queryClient.invalidateQueries({ queryKey: ['logs'] })
      } finally {
        syncing.current = false
      }
    }

    function getUnfailedOnly<T extends { sync_error?: string }>(items: T[]): T[] {
      return items.filter((i) => !i.sync_error)
    }

    flush()
    window.addEventListener('online', flush)
    return () => window.removeEventListener('online', flush)
  }, [queryClient])
}
