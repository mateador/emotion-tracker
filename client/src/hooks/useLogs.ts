import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLog, fetchLogs, ApiError, type CreateLogInput } from '../lib/api-client'
import { enqueueLog } from '../lib/offline-db'
import type { EmotionType } from '../types/emotion'
import type { EmotionLog } from '../types/log'

export function useLogsQuery(params: { start_date?: string; end_date?: string } = {}) {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: async () => {
      const { logs } = await fetchLogs(params)
      return logs as EmotionLog[]
    }
  })
}

interface CreateLogArgs {
  emotion_type: EmotionType
  trigger_tags: string[]
}

/**
 * Tries the API directly first. Falls back to the offline queue ONLY on a
 * genuine connectivity failure (fetch throws a network-level error, not an
 * ApiError) -- a real validation or auth error from the server is a
 * different problem entirely, and silently queueing it would just mean it
 * fails identically on every future retry with no way to surface that to
 * the person. Those errors are re-thrown so the UI can show them.
 */
export function useCreateLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: CreateLogArgs): Promise<{ queued: boolean }> => {
      const input: CreateLogInput = {
        client_id: crypto.randomUUID(),
        emotion_type: args.emotion_type,
        trigger_tags: args.trigger_tags,
        notes: null
      }
      try {
        await createLog(input)
        return { queued: false }
      } catch (err) {
        if (err instanceof ApiError) {
          // A real server-side rejection (validation, auth, etc.) --
          // retrying via the offline queue wouldn't help, surface it.
          throw err
        }
        // Anything else (TypeError from a failed fetch, no network, DNS
        // failure, Render cold-start timeout, etc.) is treated as
        // "currently unreachable" -- queue it for the next sync.
        await enqueueLog({
          client_id: input.client_id,
          emotion_type: input.emotion_type,
          trigger_tags: input.trigger_tags,
          notes: input.notes ?? null
        })
        return { queued: true }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    }
  })
}
